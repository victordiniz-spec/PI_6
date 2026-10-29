
import { useCallback, useMemo, useState } from "react";
import {
  useRouter,
  useFocusEffect,
  type Href,
} from "expo-router";

import * as SecureStore from "expo-secure-store";

import {
  LogOut,
  Search,
  X,
  RefreshCw,
  ClipboardList,
  AlertCircle,
  LockKeyhole,
} from "lucide-react-native";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  ordensProducaoApi,
  ErroAPI,
  type OrdemProducao,
  type SituacaoOP,
} from "@/services/ordensProducao";

// =====================================
// PRODSYNC - IDENTIDADE VISUAL
// =====================================

const theme = {
  background: "#F3F6F8",
  navy: "#123450",
  ink: "#172F42",
  muted: "#5B6E7C",
  teal: "#007F80",
  white: "#FFFFFF",
  border: "#DCE5EB",
  success: "#167046",
  successBg: "#E6F5EC",
  warning: "#B45309",
  danger: "#B42318",
};

// =====================================
// AUTENTICAÇÃO
// =====================================

const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "SUPERVISOR" | "OPERADOR";
};

// =====================================
// FORMATADORES
// =====================================

function formatarNumero(valor: number) {
  return valor.toLocaleString("pt-BR");
}

function nomeSituacao(situacao: SituacaoOP) {
  const nomes: Record<SituacaoOP, string> = {
    PENDENTE: "Pendente",
    EM_PRODUCAO: "Em produção",
    PAUSADA: "Pausada",
    FINALIZADA: "Finalizada",
    CANCELADA: "Cancelada",
  };

  return nomes[situacao] ?? situacao;
}

function corSituacao(situacao: SituacaoOP) {
  switch (situacao) {
    case "EM_PRODUCAO":
      return theme.success;
    case "FINALIZADA":
      return "#166534";
    case "PAUSADA":
      return theme.warning;
    case "CANCELADA":
      return theme.danger;
    default:
      return theme.teal;
  }
}

// =====================================
// BOTÃO PRINCIPAL
// =====================================

type ActionButtonProps = {
  title: string;
  secondary?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function ActionButton({
  title,
  secondary = false,
  disabled = false,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionButton,
        secondary
          ? styles.secondaryButton
          : styles.primaryButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          secondary
            ? styles.secondaryText
            : styles.primaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// =====================================
// INDICADORES
// =====================================

function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

// =====================================
// HOME
// =====================================

export default function HomeScreen() {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioAutenticado | null>(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [orders, setOrders] =
    useState<OrdemProducao[]>([]);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [apiError, setApiError] = useState("");
  const [sessionExpired, setSessionExpired] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [orderNumber, setOrderNumber] =
    useState("");

  const [searchError, setSearchError] =
    useState("");

  const [selectedOrderNumber, setSelectedOrderNumber] =
    useState<string | null>(null);

  // =====================================
  // VERIFICAR USUÁRIO E CARREGAR OPS
  // =====================================

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function carregarHome() {
        setCheckingSession(true);
        setLoadingOrders(true);
        setApiError("");
        setSessionExpired(false);

        try {
          const [token, usuarioSalvo] =
            await Promise.all([
              SecureStore.getItemAsync(TOKEN_KEY),
              SecureStore.getItemAsync(USER_KEY),
            ]);

          if (!active) return;

          if (!token || !usuarioSalvo) {
            setUsuario(null);
            router.replace("/");
            return;
          }

          const dados = JSON.parse(
            usuarioSalvo
          ) as UsuarioAutenticado;

          if (
            !dados.id ||
            !dados.nome ||
            !dados.email ||
            !dados.perfil
          ) {
            throw new Error(
              "Dados de sessão inválidos."
            );
          }

          setUsuario(dados);
          setCheckingSession(false);

          try {
            const lista =
              await ordensProducaoApi.listar();

            if (!active) return;

            setOrders(lista);
            setApiError("");
          } catch (error) {
            if (!active) return;

            setOrders([]);

            setApiError(
              error instanceof Error
                ? error.message
                : "Não foi possível consultar as OPs."
            );

            if (
              error instanceof ErroAPI &&
              error.status === 401
            ) {
              setSessionExpired(true);
            }
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

  // =====================================
  // ATUALIZAR DADOS DA API
  // =====================================

  async function atualizarOrdens() {
    if (refreshing) return;

    setRefreshing(true);
    setApiError("");

    try {
      const lista =
        await ordensProducaoApi.listar();

      setOrders(lista);
      setSessionExpired(false);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as OPs."
      );

      if (
        error instanceof ErroAPI &&
        error.status === 401
      ) {
        setSessionExpired(true);
      }
    } finally {
      setRefreshing(false);
    }
  }

  // =====================================
  // INDICADORES REAIS
  // =====================================

  const indicadores = useMemo(() => {
    const total = orders.length;

    const pendentes = orders.filter(
      (op) => op.situacao === "PENDENTE"
    ).length;

    const emProducao = orders.filter(
      (op) => op.situacao === "EM_PRODUCAO"
    ).length;

    const planejado = orders.reduce(
      (soma, op) =>
        soma + op.quantidadePlanejada,
      0
    );

    const produzido = orders.reduce(
      (soma, op) =>
        soma + op.quantidadeProduzida,
      0
    );

    return {
      total,
      pendentes,
      emProducao,
      planejado,
      produzido,
    };
  }, [orders]);

  // =====================================
  // ORDEM EM DESTAQUE
  // =====================================

  const selectedOrder = useMemo(() => {
    if (selectedOrderNumber) {
      const encontrada = orders.find(
        (op) =>
          op.numero === selectedOrderNumber
      );

      if (encontrada) {
        return encontrada;
      }
    }

    // Apenas destaque visual.
    // Não representa vínculo com máquina.
    return (
      orders.find(
        (op) => op.situacao === "EM_PRODUCAO"
      ) ??
      orders.find(
        (op) => op.situacao === "PENDENTE"
      ) ??
      orders[0] ??
      null
    );
  }, [orders, selectedOrderNumber]);

  const progressoSelecionado =
    selectedOrder &&
    selectedOrder.quantidadePlanejada > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (selectedOrder.quantidadeProduzida /
                selectedOrder.quantidadePlanejada) *
                100
            )
          )
        )
      : 0;

  // =====================================
  // LOGOUT
  // =====================================

  async function handleLogout() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);

      setUsuario(null);
      setOrders([]);

      router.replace("/");
    } catch {
      Alert.alert(
        "Erro ao sair",
        "Não foi possível encerrar a sessão."
      );
    }
  }

  function confirmarSaida() {
    Alert.alert(
      "Sair do PRODSYNC",
      "Deseja encerrar sua sessão?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            void handleLogout();
          },
        },
      ]
    );
  }

  // =====================================
  // NAVEGAÇÃO
  // =====================================

  function abrirDetalhesOP(numero: string) {
    router.push({
      pathname: "/ordem/[id]",
      params: { id: numero },
    });
  }

  function consultarOP() {
    const numero = orderNumber
      .trim()
      .toUpperCase();

    if (!numero) {
      setSearchError(
        "Informe o número da OP."
      );
      return;
    }

    const encontrada = orders.find(
      (op) =>
        op.numero.toUpperCase() === numero
    );

    if (!encontrada) {
      setSearchError(
        "OP não encontrada entre as ordens disponíveis."
      );
      return;
    }

    setSelectedOrderNumber(
      encontrada.numero
    );

    setOrderNumber("");
    setSearchError("");
    setSearchOpen(false);

    abrirDetalhesOP(encontrada.numero);
  }

  function abrirConsulta() {
    setOrderNumber("");
    setSearchError("");
    setSearchOpen(true);
  }

  function handleLerCodigo() {
    // Mantém a navegação existente.
    router.push("/(tabs)/bipagem");
  }

  function handleValidarPacotes() {
    Alert.alert(
      "Validação ainda não disponível",
      "A consulta das OPs já utiliza dados reais. A validação de pacotes será liberada quando implementarmos o cadastro de etiquetas, a bipagem segura e o vínculo entre tablet e máquina."
    );
  }

  // =====================================
  // CARREGAMENTO DA SESSÃO
  // =====================================

  if (checkingSession || !usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.teal}
          />

          <Text style={styles.loadingText}>
            Verificando acesso ao PRODSYNC...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const primeiroNome =
    usuario.nome.trim().split(/\s+/)[0];

  // =====================================
  // INTERFACE PRINCIPAL
  // =====================================

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
    >
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>
              PRODSYNC / JM FORROS
            </Text>

            <Text style={styles.pageTitle}>
              Início
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Pressable
              onPress={() =>
                void atualizarOrdens()
              }
              disabled={refreshing}
              accessibilityLabel="Atualizar dados"
              style={styles.iconButton}
            >
              {refreshing ? (
                <ActivityIndicator
                  color={theme.teal}
                />
              ) : (
                <RefreshCw
                  size={21}
                  color={theme.navy}
                />
              )}
            </Pressable>

            <Pressable
              onPress={confirmarSaida}
              accessibilityLabel="Sair da conta"
              style={styles.iconButton}
            >
              <LogOut
                size={21}
                color={theme.navy}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BOAS-VINDAS */}
        <Text style={styles.greeting}>
          Olá, {primeiroNome}.
        </Text>

        {/* OPERADOR AUTENTICADO */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {primeiroNome
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text
              style={styles.userName}
              numberOfLines={1}
            >
              {usuario.nome}
            </Text>

            <Text
              style={styles.userEmail}
              numberOfLines={1}
            >
              {usuario.email}
            </Text>

            <Text style={styles.userProfile}>
              Perfil: {usuario.perfil}
            </Text>
          </View>
        </View>

        {/* STATUS DA CONSULTA */}
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>
            {loadingOrders
              ? "Consultando ordens no Mini ERP..."
              : apiError
                ? "Não foi possível atualizar os dados."
                : "Ordens consultadas no Mini ERP."}
          </Text>
        </View>

        {/* MENSAGENS DE ERRO */}
        {!!apiError && (
          <View style={styles.errorCard}>
            <AlertCircle
              size={20}
              color={theme.danger}
            />

            <View style={{ flex: 1, gap: 10 }}>
              <Text style={styles.errorText}>
                {apiError}
              </Text>

              {sessionExpired && (
                <Pressable
                  onPress={() =>
                    router.replace("/")
                  }
                  style={styles.errorButton}
                >
                  <Text style={styles.errorButtonText}>
                    Fazer login novamente
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* AÇÕES PRINCIPAIS */}
        <ActionButton
          title="Consultar OP"
          onPress={abrirConsulta}
        />

        <ActionButton
          title="Ler código da OP"
          secondary
          onPress={handleLerCodigo}
        />

        {/* INDICADORES REAIS */}
        <Text style={styles.sectionTitle}>
          Resumo das ordens disponíveis
        </Text>

        <View style={styles.metricsContainer}>
          <MetricCard
            value={
              loadingOrders
                ? "..."
                : formatarNumero(
                    indicadores.total
                  )
            }
            label="OPs disponíveis"
          />

          <MetricCard
            value={
              loadingOrders
                ? "..."
                : formatarNumero(
                    indicadores.pendentes
                  )
            }
            label="OPs pendentes"
          />
        </View>

        <View style={styles.metricsContainer}>
          <MetricCard
            value={
              loadingOrders
                ? "..."
                : formatarNumero(
                    indicadores.emProducao
                  )
            }
            label="OPs em produção"
          />

          <MetricCard
            value={
              loadingOrders
                ? "..."
                : formatarNumero(
                    indicadores.produzido
                  )
            }
            label="Unidades produzidas"
          />
        </View>

        {/* ORDEM EM DESTAQUE */}
        <Text style={styles.sectionTitle}>
          Ordem em destaque
        </Text>

        {loadingOrders ? (
          <View style={styles.orderCard}>
            <ActivityIndicator
              color={theme.teal}
            />

            <Text style={styles.orderDescription}>
              Carregando ordens reais...
            </Text>
          </View>
        ) : apiError ? (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>
              Dados indisponíveis
            </Text>

            <Text style={styles.orderDescription}>
              Atualize a Home para consultar
              novamente o ERP.
            </Text>
          </View>
        ) : selectedOrder ? (
          <Pressable
            style={styles.orderCard}
            onPress={() =>
              abrirDetalhesOP(
                selectedOrder.numero
              )
            }
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderTitle}>
                OP {selectedOrder.numero}
              </Text>

              <Text
                style={{
                  color: corSituacao(
                    selectedOrder.situacao
                  ),
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {nomeSituacao(
                  selectedOrder.situacao
                )}
              </Text>
            </View>

            <Text style={styles.orderDescription}>
              {selectedOrder.produto?.descricao ??
                "Produto não identificado"}
            </Text>

            <Text style={styles.orderHint}>
              Código:{" "}
              {selectedOrder.produto?.codigo ?? "—"}
            </Text>

            <View style={styles.orderValues}>
              <View>
                <Text style={styles.smallLabel}>
                  Planejado
                </Text>

                <Text style={styles.smallValue}>
                  {formatarNumero(
                    selectedOrder.quantidadePlanejada
                  )}
                </Text>
              </View>

              <View>
                <Text style={styles.smallLabel}>
                  Produzido
                </Text>

                <Text style={styles.smallValue}>
                  {formatarNumero(
                    selectedOrder.quantidadeProduzida
                  )}
                </Text>
              </View>

              <View>
                <Text style={styles.smallLabel}>
                  Progresso
                </Text>

                <Text style={styles.smallValue}>
                  {progressoSelecionado}%
                </Text>
              </View>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressoSelecionado}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.orderHint}>
              Toque para consultar os detalhes
            </Text>
          </Pressable>
        ) : (
          <View style={styles.orderCard}>
            <ClipboardList
              size={28}
              color={theme.muted}
            />

            <Text style={styles.orderTitle}>
              Nenhuma ordem disponível
            </Text>

            <Text style={styles.orderDescription}>
              Cadastre uma OP no Mini ERP
              para visualizá-la aqui.
            </Text>
          </View>
        )}

        {/* VALIDAÇÃO DE PACOTES */}
        <ActionButton
          title="Validar pacotes"
          secondary
          onPress={handleValidarPacotes}
        />

        {/* AVISO DE SEGURANÇA */}
        <View style={styles.securityCard}>
          <LockKeyhole
            size={19}
            color={theme.teal}
          />

          <Text style={styles.securityText}>
            Os indicadores representam as
            ordens retornadas pelo ERP, não
            apenas as de uma máquina.
            A identificação do tablet e
            o vínculo com a máquina serão
            implementados no módulo de segurança.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL DE CONSULTA */}
      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSearchOpen(false)
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          style={styles.modalOverlay}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.modalScroll
            }
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Consultar OP
                </Text>

                <Pressable
                  onPress={() =>
                    setSearchOpen(false)
                  }
                  accessibilityLabel="Fechar consulta"
                >
                  <X
                    color={theme.ink}
                    size={24}
                  />
                </Pressable>
              </View>

              <Text
                style={styles.modalDescription}
              >
                Digite o número de uma OP
                cadastrada no Mini ERP para
                visualizar seus detalhes.
              </Text>

              <TextInput
                value={orderNumber}
                onChangeText={(texto) => {
                  setOrderNumber(texto);
                  setSearchError("");
                }}
                placeholder="Ex.: 2026-0148"
                placeholderTextColor={
                  theme.muted
                }
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.searchInput}
                onSubmitEditing={consultarOP}
              />

              {!!searchError && (
                <Text style={styles.errorText}>
                  {searchError}
                </Text>
              )}

              <Pressable
                style={styles.modalPrimary}
                onPress={consultarOP}
              >
                <Search
                  color={theme.white}
                  size={19}
                />

                <Text
                  style={styles.primaryText}
                >
                  Consultar ordem
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalSecondary}
                onPress={() => {
                  setSearchOpen(false);

                  router.push(
                    "/(tabs)/ordens" as Href
                  );
                }}
              >
                <Text
                  style={styles.secondaryText}
                >
                  Ver todas as ordens
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================
// ESTILOS
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  loadingText: {
    color: theme.muted,
    fontSize: 14,
  },

  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerText: {
    flex: 1,
    gap: 4,
  },

  brand: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    color: theme.teal,
  },

  pageTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: theme.ink,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 16,
  },

  greeting: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: theme.ink,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
  },

  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E1F3F2",
    alignItems: "center",
    justifyContent: "center",
  },

  userInitial: {
    color: theme.teal,
    fontWeight: "700",
    fontSize: 21,
  },

  userInfo: {
    flex: 1,
    gap: 3,
  },

  userName: {
    color: theme.ink,
    fontSize: 15,
    fontWeight: "700",
  },

  userEmail: {
    color: theme.muted,
    fontSize: 12,
  },

  userProfile: {
    color: theme.teal,
    fontSize: 12,
    fontWeight: "600",
  },

  connectionStatus: {
    backgroundColor: theme.successBg,
    borderRadius: 12,
    padding: 12,
    minHeight: 40,
    justifyContent: "center",
  },

  connectionText: {
    color: theme.success,
    fontSize: 12,
    lineHeight: 19,
  },

  actionButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    backgroundColor: theme.navy,
  },

  secondaryButton: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
  },

  actionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },

  primaryText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryText: {
    color: theme.navy,
    fontSize: 16,
    fontWeight: "600",
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.75,
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: theme.ink,
  },

  orderCard: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  orderTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: theme.ink,
  },

  orderDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.muted,
  },

  orderHint: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.muted,
  },

  orderValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },

  smallLabel: {
    color: theme.muted,
    fontSize: 12,
  },

  smallValue: {
    color: theme.ink,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4,
  },

  progressBackground: {
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: theme.teal,
    borderRadius: 8,
  },

  metricsContainer: {
    flexDirection: "row",
    gap: 16,
  },

  metricCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 110,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },

  metricValue: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    color: theme.ink,
  },

  metricLabel: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    color: theme.muted,
  },

  securityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#E7F2F3",
    borderWidth: 1,
    borderColor: "#C8E4E3",
    padding: 14,
  },

  securityText: {
    flex: 1,
    color: theme.navy,
    fontSize: 12,
    lineHeight: 19,
  },

  errorCard: {
    backgroundColor: "#FEEDEC",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  errorText: {
    color: theme.danger,
    fontSize: 13,
    lineHeight: 19,
  },

  errorButton: {
    backgroundColor: theme.navy,
    borderRadius: 9,
    padding: 10,
    alignItems: "center",
  },

  errorButtonText: {
    color: theme.white,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,17,31,0.65)",
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: theme.white,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    color: theme.ink,
    fontSize: 20,
    fontWeight: "700",
  },

  modalDescription: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 21,
  },

  searchInput: {
    height: 54,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.ink,
    backgroundColor: theme.background,
  },

  modalPrimary: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: theme.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  modalSecondary: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
