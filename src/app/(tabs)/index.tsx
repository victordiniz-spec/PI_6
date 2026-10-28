
import { useRouter, useFocusEffect, type Href } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  LogOut,
  Search,
  X,
} from "lucide-react-native";

import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// =====================================
// PRODSYNC - CORES DO FIGMA
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
};

// =====================================
// CONFIGURACAO DE DEMONSTRACAO
// =====================================

// Ainda nao estamos buscando OPs pela API.
const DEMO_MODE = true;

const demoOrder = {
  number: "2026-0148",
  product: "Forro PVC branco",
  code: "PVC-001",
  status: "Em produção",
  quantity: 600,
  pendingPackages: 6,
};

// =====================================
// SESSAO DO USUARIO
// =====================================

// Devem ser iguais as chaves usadas
// no login principal do aplicativo.
const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "SUPERVISOR" | "OPERADOR";
};

// =====================================
// COMPONENTES REUTILIZAVEIS
// =====================================

type ActionButtonProps = {
  title: string;
  secondary?: boolean;
  onPress: () => void;
};

function ActionButton({
  title,
  secondary = false,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionButton,
        secondary
          ? styles.secondaryButton
          : styles.primaryButton,
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

type MetricCardProps = {
  value: string;
  label: string;
};

function MetricCard({
  value,
  label,
}: MetricCardProps) {
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
// TELA HOME
// =====================================

export default function HomeScreen() {
  const router = useRouter();

  // Usuario conectado
  const [usuario, setUsuario] =
    useState<UsuarioAutenticado | null>(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  // Consulta de OP
  const [searchOpen, setSearchOpen] =
    useState(false);

  const [orderNumber, setOrderNumber] =
    useState("");

  // Dados demonstrativos
  const selectedOrder = DEMO_MODE
    ? demoOrder
    : null;

  // =====================================
  // VERIFICAR SESSAO
  // =====================================

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function verificarSessao() {
        try {
          const token =
            await SecureStore.getItemAsync(TOKEN_KEY);

          const usuarioSalvo =
            await SecureStore.getItemAsync(USER_KEY);

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
              "Dados de sessão inválidos"
            );
          }

          setUsuario(dados);
        } catch {
          if (!active) return;

          setUsuario(null);
          router.replace("/");
        } finally {
          if (active) {
            setCheckingSession(false);
          }
        }
      }

      setCheckingSession(true);
      void verificarSessao();

      return () => {
        active = false;
      };
    }, [router])
  );

  // =====================================
  // ENCERRAR SESSAO
  // =====================================

  async function handleLogout() {
    try {
      await SecureStore.deleteItemAsync(
        TOKEN_KEY
      );

      await SecureStore.deleteItemAsync(
        USER_KEY
      );

      setUsuario(null);

      router.replace("/");
    } catch {
      Alert.alert(
        "Erro ao sair",
        "Não foi possível encerrar a sessão. Tente novamente."
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
  // NAVEGACAO PARA AS OPs
  // =====================================

  function openOrderDetails(value: string) {
    const id = value.trim();

    if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) {
      Alert.alert(
        "Número inválido",
        "Digite uma OP com letras, números ou hífen."
      );
      return;
    }

    setSearchOpen(false);
    setOrderNumber("");

    router.push(
      `/ordem/${encodeURIComponent(id)}` as Href
    );
  }

  function handleConsultarOP() {
    setSearchOpen(true);
  }

  function handleLerCodigo() {
    router.push("/(tabs)/bipagem");
  }

  function handleValidarPacotes() {
    router.push("/(tabs)/bipagem");
  }

  // =====================================
  // CARREGAMENTO DA SESSAO
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
      {/* CABECALHO */}
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

          <Pressable
            onPress={confirmarSaida}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={styles.logoutButton}
          >
            <LogOut
              size={21}
              color={theme.navy}
            />
          </Pressable>
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

        {/* IDENTIFICACAO DO OPERADOR */}
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

        {/* STATUS DO ERP */}
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>
            Sessão identificada ·
            Ordens em modo de demonstração
          </Text>
        </View>

        {/* ACOES PRINCIPAIS */}
        <ActionButton
          title="Consultar OP"
          onPress={handleConsultarOP}
        />

        <ActionButton
          title="Ler código da OP"
          secondary
          onPress={handleLerCodigo}
        />

        {/* ORDEM SELECIONADA */}
        <Text style={styles.sectionTitle}>
          Ordem selecionada
        </Text>

        {selectedOrder ? (
          <Pressable
            style={styles.orderCard}
            onPress={() =>
              openOrderDetails(
                selectedOrder.number
              )
            }
          >
            <Text style={styles.orderTitle}>
              OP {selectedOrder.number}
            </Text>

            <Text style={styles.orderDescription}>
              {selectedOrder.product} ·{" "}
              {selectedOrder.code}
            </Text>

            <Text style={styles.orderStatus}>
              ● {selectedOrder.status}
            </Text>

            <Text style={styles.orderHint}>
              Ordem demonstrativa ·
              Toque para visualizar
            </Text>
          </Pressable>
        ) : (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>
              Nenhuma ordem selecionada
            </Text>

            <Text style={styles.orderDescription}>
              Consulte uma ordem para
              visualizar os dados de produção.
            </Text>
          </View>
        )}

        {/* INDICADORES */}
        <View style={styles.metricsContainer}>
          <MetricCard
            value={
              selectedOrder
                ? String(
                    selectedOrder.quantity
                  )
                : "—"
            }
            label="peças · demonstração"
          />

          <MetricCard
            value={
              selectedOrder
                ? String(
                    selectedOrder.pendingPackages
                  )
                : "—"
            }
            label="pacotes a validar"
          />
        </View>

        <ActionButton
          title="Validar pacotes"
          secondary
          onPress={handleValidarPacotes}
        />

        <Text style={styles.demoNotice}>
          Demonstração · Produção e OPs
          ainda não integradas ao ERP
        </Text>
      </ScrollView>

      {/* MODAL DE CONSULTA DE OP */}
      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSearchOpen(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Consultar OP
              </Text>

              <Pressable
                onPress={() =>
                  setSearchOpen(false)
                }
                accessibilityRole="button"
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
              Digite o número de uma
              ordem para abrir seus detalhes.
              A consulta ainda está em modo
              de demonstração.
            </Text>

            <TextInput
              value={orderNumber}
              onChangeText={setOrderNumber}
              placeholder="Ex.: 10245"
              placeholderTextColor={
                theme.muted
              }
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.searchInput}
              onSubmitEditing={() =>
                openOrderDetails(orderNumber)
              }
            />

            <Pressable
              style={styles.modalPrimary}
              onPress={() =>
                openOrderDetails(orderNumber)
              }
              accessibilityRole="button"
            >
              <Search
                color={theme.white}
                size={19}
              />

              <Text
                style={styles.primaryText}
              >
                Abrir OP (teste)
              </Text>
            </Pressable>

            <Pressable
              style={styles.modalSecondary}
              onPress={() => {
                setSearchOpen(false);

                router.push(
                  "/(tabs)/ordens"
                );
              }}
              accessibilityRole="button"
            >
              <Text
                style={styles.secondaryText}
              >
                Ver todas as ordens
              </Text>
            </Pressable>
          </View>
        </View>
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

  logoutButton: {
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
    paddingBottom: 24,
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
    fontWeight: "500",
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

  orderTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: theme.ink,
  },

  orderDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.muted,
  },

  orderStatus: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.ink,
  },

  orderHint: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.muted,
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
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "700",
    color: theme.ink,
  },

  metricLabel: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    color: theme.muted,
  },

  demoNotice: {
    fontSize: 12,
    lineHeight: 20,
    color: theme.muted,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,17,31,0.65)",
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
