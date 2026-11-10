import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  LogOut,
  LockKeyhole,
  QrCode,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react-native";
import { useAppTheme, getOperationalColors, type OperationalColors } from "@/theme/colors";

import {
  ErroAPI,
  ordensProducaoApi,
  type OrdemProducao,
  type SituacaoOP,
} from "@/services/ordensProducao";

// A Home usa apenas a API local do PRODSYNC.
// O backend é responsável pela integração com o Sankhya.
const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";


type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "SUPERVISOR" | "OPERADOR";
};

const rotulos: Record<SituacaoOP, string> = {
  PENDENTE: "Pendente",
  EM_PRODUCAO: "Em produção",
  PAUSADA: "Pausada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function corEstado(situacao: SituacaoOP, palette: OperationalColors) {
  switch (situacao) {
    case "EM_PRODUCAO":
    case "FINALIZADA":
      return { fundo: palette.successBg, texto: palette.success };
    case "PAUSADA":
      return { fundo: palette.warningBg, texto: palette.warning };
    case "CANCELADA":
      return { fundo: palette.dangerBg, texto: palette.danger };
    default:
      return { fundo: "#E8F1FA", texto: palette.navy };
  }
}

function formatarNumero(numero: number) {
  return numero.toLocaleString("pt-BR");
}

function PrimaryAction({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  const { palette: appPalette } = useAppTheme();
  const palette = getOperationalColors(appPalette);
  const styles = useMemo(() => createStyles(palette), [appPalette]);
  return (
    <View
      style={[
        styles.actionShell,
        secondary ? styles.actionShellSecondary : styles.actionShellPrimary,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.actionTouch, pressed && styles.pressed]}
      >
        <View style={styles.actionContents}>
          {secondary ? (
            <QrCode size={21} color={palette.navy} />
          ) : (
            <ClipboardList size={21} color={palette.onPrimary} />
          )}
          <Text
            style={[
              styles.actionText,
              secondary ? styles.actionTextSecondary : styles.actionTextPrimary,
            ]}
          >
            {label}
          </Text>
          <ArrowRight size={19} color={secondary ? palette.navy : palette.onPrimary} />
        </View>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { palette: appPalette } = useAppTheme();
  const palette = getOperationalColors(appPalette);
  const styles = useMemo(() => createStyles(palette), [appPalette]);
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [orders, setOrders] = useState<OrdemProducao[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [searchError, setSearchError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function carregarHome() {
        setCheckingSession(true);
        setLoadingOrders(true);
        setApiError("");
        setSessionExpired(false);
        try {
          const [token, usuarioSalvo] = await Promise.all([
            SecureStore.getItemAsync(TOKEN_KEY),
            SecureStore.getItemAsync(USER_KEY),
          ]);
          if (!active) return;
          if (!token || !usuarioSalvo) {
            setUsuario(null);
            router.replace("/");
            return;
          }
          const dados = JSON.parse(usuarioSalvo) as UsuarioAutenticado;
          if (
            !dados?.id ||
            !dados.nome ||
            !dados.email ||
            !["ADMIN", "SUPERVISOR", "OPERADOR"].includes(dados.perfil)
          ) {
            throw new Error("Sessão inválida");
          }
          setUsuario(dados);
          setCheckingSession(false);
          try {
            const lista = await ordensProducaoApi.listar();
            if (!active) return;
            setOrders(lista);
            setApiError("");
          } catch (err) {
            if (!active) return;
            setOrders([]);
            setApiError(
              err instanceof Error ? err.message : "Não foi possível consultar as OPs."
            );
            setSessionExpired(err instanceof ErroAPI && err.status === 401);
          }
        } catch {
          if (!active) return;
          setUsuario(null);
          router.replace("/");
        } finally {
          if (active) {
            setCheckingSession(false);
            setLoadingOrders(false);
          }
        }
      }
      void carregarHome();
      return () => {
        active = false;
      };
    }, [router])
  );

  async function atualizarOrdens() {
    if (refreshing || loadingOrders) return;
    setRefreshing(true);
    setApiError("");
    try {
      const lista = await ordensProducaoApi.listar();
      setOrders(lista);
      setSessionExpired(false);
    } catch (err) {
      setOrders([]);
      setApiError(err instanceof Error ? err.message : "Falha ao atualizar as OPs.");
      setSessionExpired(err instanceof ErroAPI && err.status === 401);
    } finally {
      setRefreshing(false);
    }
  }

  // Indicadores simples do conjunto retornado, não da máquina atual.
  const totais = useMemo(
    () => ({
      disponiveis: orders.length,
      emProducao: orders.filter((op) => op.situacao === "EM_PRODUCAO").length,
    }),
    [orders]
  );

  // Destaque da lista. Não significa OP atribuída à máquina/tablet.
  const ordemDestaque = useMemo(
    () =>
      orders.find((op) => op.situacao === "EM_PRODUCAO") ??
      orders.find((op) => op.situacao === "PENDENTE") ??
      orders[0] ??
      null,
    [orders]
  );

  const percentual = ordemDestaque && ordemDestaque.quantidadePlanejada > 0
    ? Math.max(0, Math.min(100, Math.round(
        (ordemDestaque.quantidadeProduzida / ordemDestaque.quantidadePlanejada) * 100
      )))
    : 0;

  function abrirOrdem(numero: string) {
    if (!/^[A-Za-z0-9-]{1,40}$/.test(numero)) {
      Alert.alert("OP inválida", "Não foi possível abrir esta ordem.");
      return;
    }
    router.push({ pathname: "/ordem/[id]", params: { id: numero } });
  }

  function abrirConsulta() {
    setOrderNumber("");
    setSearchError("");
    setSearchOpen(true);
  }

  function consultarOP() {
    const numero = orderNumber.trim().toUpperCase();
    if (!numero) {
      setSearchError("Informe o número da OP.");
      return;
    }
    const encontrada = orders.find((op) => op.numero.toUpperCase() === numero);
    if (!encontrada) {
      setSearchError("OP não encontrada na lista. Consulte todas as ordens.");
      return;
    }
    setSearchOpen(false);
    setOrderNumber("");
    setSearchError("");
    abrirOrdem(encontrada.numero);
  }

  async function sair() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
      setUsuario(null);
      setOrders([]);
      router.replace("/");
    } catch {
      Alert.alert("Erro ao sair", "Não foi possível encerrar sua sessão.");
    }
  }

  function confirmarSaida() {
    Alert.alert("Sair do PRODSYNC", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void sair() },
    ]);
  }

  if (checkingSession || !usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.navy} />
          <Text style={styles.muted}>Verificando acesso ao PRODSYNC...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primeiroNome = usuario.nome.trim().split(/\s+/)[0];
  const estado = ordemDestaque ? corEstado(ordemDestaque.situacao, palette) : null;

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>PRODSYNC  /  JM FORROS</Text>
            <Text style={styles.headerTitle}>Início</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atualizar informações"
            disabled={loadingOrders || refreshing}
            onPress={() => void atualizarOrdens()}
            style={styles.headerIcon}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={palette.onPrimary} />
            ) : (
              <RefreshCw size={20} color={palette.onPrimary} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            onPress={confirmarSaida}
            style={styles.headerIcon}
          >
            <LogOut size={20} color={palette.onPrimary} />
          </Pressable>
        </View>
        <Text style={styles.headerGreeting}>Olá, {primeiroNome}!</Text>
        <Text style={styles.headerSubtitle}>Acesse suas ordens e atividades de produção.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void atualizarOrdens()}
            tintColor={palette.navy}
          />
        }
      >
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <UserRound size={24} color={palette.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>SESSÃO ATIVA</Text>
            <Text style={styles.userName} numberOfLines={1}>{usuario.nome}</Text>
            <Text style={styles.userDetail} numberOfLines={1}>{usuario.perfil} · {usuario.email}</Text>
          </View>
        </View>

        {apiError ? (
          <View style={styles.errorCard}>
            <AlertCircle size={21} color={palette.danger} />
            <View style={{ flex: 1, gap: 9 }}>
              <Text style={styles.errorText}>{apiError}</Text>
              {sessionExpired && (
                <Pressable onPress={() => router.replace("/")} style={styles.errorAction}>
                  <Text style={styles.errorActionText}>Fazer login novamente</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.connectionCard}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>
              {loadingOrders ? "Consultando ordens no PRODSYNC..." : "Ordens atualizadas pela API do PRODSYNC"}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Acesso rápido</Text>
        <PrimaryAction label="Consultar OP" onPress={abrirConsulta} />
        <PrimaryAction
          label="Ler código / bipagem"
          secondary
          onPress={() => router.push("/(tabs)/bipagem" as Href)}
        />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Ordens disponíveis</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todas as ordens"
            onPress={() => router.push("/(tabs)/ordens" as Href)}
          >
            <Text style={styles.sectionLink}>Ver todas</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total de OPs</Text>
            <Text style={styles.summaryNumber}>
              {loadingOrders ? "—" : formatarNumero(totais.disponiveis)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Em produção</Text>
            <Text style={styles.summaryNumber}>
              {loadingOrders ? "—" : formatarNumero(totais.emProducao)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ordem em destaque</Text>
        {loadingOrders ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={palette.navy} />
            <Text style={styles.muted}>Carregando ordens...</Text>
          </View>
        ) : apiError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Dados indisponíveis</Text>
            <Text style={styles.muted}>Atualize a lista para tentar novamente.</Text>
          </View>
        ) : ordemDestaque ? (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>OP #{ordemDestaque.numero}</Text>
              {estado && (
                <View style={[styles.statusBadge, { backgroundColor: estado.fundo }]}>
                  <Text style={[styles.statusText, { color: estado.texto }]}>
                    {rotulos[ordemDestaque.situacao]}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.orderBody}>
              <Text style={styles.productName}>
                {ordemDestaque.produto?.descricao ?? "Produto não identificado"}
              </Text>
              <Text style={styles.muted}>Código: {ordemDestaque.produto?.codigo ?? "—"}</Text>
              <View style={styles.quantities}>
                <View style={styles.quantityBox}>
                  <Text style={styles.quantityLabel}>Planejado</Text>
                  <Text style={styles.quantityValue}>
                    {formatarNumero(ordemDestaque.quantidadePlanejada)}
                  </Text>
                </View>
                <View style={styles.quantityBox}>
                  <Text style={styles.quantityLabel}>Produzido</Text>
                  <Text style={styles.quantityValue}>
                    {formatarNumero(ordemDestaque.quantidadeProduzida)}
                  </Text>
                </View>
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={styles.quantityLabel}>Progresso</Text>
                <Text style={styles.progressValue}>{percentual}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentual}%` }]} />
              </View>
              <PrimaryAction
                label="Ver detalhes da OP"
                onPress={() => abrirOrdem(ordemDestaque.numero)}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <ClipboardList size={28} color={palette.muted} />
            <Text style={styles.emptyTitle}>Nenhuma ordem disponível</Text>
            <Text style={styles.muted}>
              As OPs precisam estar cadastradas no PRODSYNC para aparecer aqui.
            </Text>
          </View>
        )}

        <View style={styles.noticeCard}>
          <LockKeyhole size={19} color={palette.navy} />
          <Text style={styles.noticeText}>
            As ordens exibidas vêm do PRODSYNC. A OP em destaque é apenas uma sugestão
            da lista e não indica vínculo deste tablet com uma máquina.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScroll}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Consultar OP</Text>
                <Pressable
                  onPress={() => setSearchOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar consulta"
                >
                  <X size={24} color={palette.navy} />
                </Pressable>
              </View>
              <Text style={styles.muted}>
                Informe o número de uma OP disponível na lista do PRODSYNC.
              </Text>
              <View style={styles.inputShell}>
                <Search size={20} color={palette.muted} />
                <TextInput
                  style={styles.searchInput}
                  value={orderNumber}
                  onChangeText={(value) => {
                    setOrderNumber(value);
                    setSearchError("");
                  }}
                  placeholder="Ex.: 42870"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={consultarOP}
                />
              </View>
              {!!searchError && <Text style={styles.errorText}>{searchError}</Text>}
              <PrimaryAction label="Consultar ordem" onPress={consultarOP} />
              <View style={styles.modalSecondaryShell}>
                <Pressable
                  onPress={() => {
                    setSearchOpen(false);
                    router.push("/(tabs)/ordens" as Href);
                  }}
                  style={styles.modalSecondaryTouch}
                >
                  <Text style={styles.modalSecondaryText}>Ver todas as ordens</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(palette: OperationalColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  header: {
    backgroundColor: "#17395C",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 27,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: "#A9D8E3", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  headerTitle: { color: palette.onPrimary, fontSize: 29, fontWeight: "800", marginTop: 3 },
  headerIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 13,
  },
  headerGreeting: { color: palette.onPrimary, fontSize: 19, fontWeight: "700", marginTop: 17 },
  headerSubtitle: { color: "#D5E4EF", fontSize: 13, lineHeight: 19, marginTop: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40, gap: 14 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E6F0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEyebrow: { color: palette.blue, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  userName: { color: palette.ink, fontSize: 15, fontWeight: "800", marginTop: 3 },
  userDetail: { color: palette.muted, fontSize: 12, marginTop: 3 },
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.successBg,
    padding: 12,
    borderRadius: 12,
  },
  connectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.success },
  connectionText: { color: palette.success, fontSize: 12, flex: 1 },
  errorCard: {
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    backgroundColor: palette.dangerBg,
  },
  errorText: { color: palette.danger, fontSize: 13, lineHeight: 19 },
  errorAction: { padding: 10, borderRadius: 9, backgroundColor: "#17395C", alignItems: "center" },
  errorActionText: { color: palette.onPrimary, fontWeight: "700" },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLink: { color: palette.blue, fontSize: 13, fontWeight: "700" },
  actionShell: { width: "100%", borderRadius: 13, overflow: "hidden", borderWidth: 1 },
  actionShellPrimary: { backgroundColor: "#17395C", borderColor: "#17395C" },
  actionShellSecondary: { backgroundColor: palette.white, borderColor: palette.border },
  actionTouch: { width: "100%", minHeight: 58, justifyContent: "center", paddingHorizontal: 16 },
  actionContents: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionText: { fontSize: 15, fontWeight: "800" },
  actionTextPrimary: { color: palette.onPrimary },
  actionTextSecondary: { color: palette.navy },
  pressed: { opacity: 0.8 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    gap: 7,
  },
  summaryLabel: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  summaryNumber: { color: palette.navy, fontSize: 29, fontWeight: "800" },
  orderCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    borderColor: palette.border,
    borderWidth: 1,
    overflow: "hidden",
  },
  orderHeader: {
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.soft,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  orderNumber: { color: palette.navy, fontSize: 19, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: "700" },
  orderBody: { padding: 15, gap: 13 },
  productName: { color: palette.ink, fontSize: 15, fontWeight: "700", lineHeight: 22 },
  quantities: { flexDirection: "row", gap: 10 },
  quantityBox: { flex: 1, backgroundColor: palette.soft, padding: 11, borderRadius: 11 },
  quantityLabel: { color: palette.muted, fontSize: 12 },
  quantityValue: { color: palette.navy, fontWeight: "800", fontSize: 22, marginTop: 4 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressValue: { color: palette.navy, fontWeight: "800", fontSize: 13 },
  progressTrack: { width: "100%", height: 8, borderRadius: 99, backgroundColor: palette.border, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: palette.blue, borderRadius: 99 },
  emptyCard: {
    backgroundColor: palette.white,
    borderRadius: 15,
    borderColor: palette.border,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: "800", textAlign: "center" },
  noticeCard: {
    backgroundColor: palette.soft,
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    gap: 10,
  },
  noticeText: { flex: 1, color: palette.navy, fontSize: 12, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(7,17,31,0.65)" },
  modalScroll: { flexGrow: 1, justifyContent: "center", padding: 22 },
  modalCard: { backgroundColor: palette.white, borderRadius: 18, padding: 20, gap: 17 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { color: palette.navy, fontSize: 21, fontWeight: "800" },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.soft,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, height: 54, fontSize: 16, color: palette.ink },
  modalSecondaryShell: { borderRadius: 12, borderWidth: 1, borderColor: palette.border, overflow: "hidden" },
  modalSecondaryTouch: { minHeight: 54, alignItems: "center", justifyContent: "center" },
  modalSecondaryText: { color: palette.navy, fontWeight: "700", fontSize: 15 },
});
}
