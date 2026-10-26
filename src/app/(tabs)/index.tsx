
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Cores originais do Figma
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

// Dados demonstrativos do protótipo.
// Futuramente serão substituídos pelos dados do Sankhya.
const DEMO_MODE = true;

const demoOrder = {
  number: "2026-0148",
  product: "Forro PVC branco",
  code: "PVC-001",
  status: "Em produção",
  quantity: 600,
  pendingPackages: 6,
};

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
          styles.actionButtonText,
          secondary
            ? styles.secondaryButtonText
            : styles.primaryButtonText,
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

export default function HomeScreen() {
  const router = useRouter();

  // Temporariamente não existe OP real selecionada.
  const selectedOrder = DEMO_MODE ? demoOrder : null;

  function handleConsultarOP() {
    router.push("/ordens");
  }

  function handleLerCodigo() {
    router.push("/bipagem");
  }

  function handleValidarPacotes() {
    router.push("/bipagem");
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
    >
      {/* Cabeçalho da Home */}
      <View style={styles.header}>
        <Text style={styles.brand}>
          PRODSYNC / JM FORROS
        </Text>

        <Text style={styles.pageTitle}>
          Início
        </Text>
      </View>

      {/* Conteúdo com rolagem */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          Bom dia, Carlos.
        </Text>

        {/* Indicador demonstrativo de conexão */}
        {DEMO_MODE && (
          <View style={styles.connectionStatus}>
            <Text style={styles.connectionText}>
              ✓ Sankhya disponível · simulado
            </Text>
          </View>
        )}

        {/* Ações principais */}
        <ActionButton
          title="Consultar OP"
          onPress={handleConsultarOP}
        />

        <ActionButton
          title="Ler código da OP"
          secondary
          onPress={handleLerCodigo}
        />

        {/* Ordem de produção */}
        <Text style={styles.sectionTitle}>
          Ordem selecionada
        </Text>

        {selectedOrder ? (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>
              OP {selectedOrder.number}
            </Text>

            <Text style={styles.orderDescription}>
              {selectedOrder.product} · {selectedOrder.code}
            </Text>

            <Text style={styles.orderStatus}>
              ● {selectedOrder.status}
            </Text>

            <Text style={styles.orderHint}>
              Ordem demonstrativa do protótipo
            </Text>
          </View>
        ) : (
          <View style={styles.emptyOrderCard}>
            <Text style={styles.emptyTitle}>
              Nenhuma ordem selecionada
            </Text>

            <Text style={styles.emptyDescription}>
              Consulte uma OP para visualizar os dados de produção.
            </Text>
          </View>
        )}

        {/* Indicadores */}
        <View style={styles.metricsContainer}>
          <MetricCard
            value={
              selectedOrder
                ? String(selectedOrder.quantity)
                : "—"
            }
            label={
              selectedOrder
                ? "peças · OP 0148"
                : "peças produzidas"
            }
          />

          <MetricCard
            value={
              selectedOrder
                ? String(selectedOrder.pendingPackages)
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

        {DEMO_MODE && (
          <Text style={styles.demoNotice}>
            Demonstração · Dados e conexão simulados
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
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

  connectionStatus: {
    backgroundColor: theme.successBg,
    borderRadius: 12,
    padding: 8,
    minHeight: 36,
    justifyContent: "center",
  },

  connectionText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    color: theme.success,
  },

  actionButton: {
    width: "100%",
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

  actionButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },

  primaryButtonText: {
    color: theme.white,
  },

  secondaryButtonText: {
    color: theme.navy,
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
    width: "100%",
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
    fontWeight: "400",
    color: theme.muted,
  },

  orderStatus: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.ink,
  },

  orderHint: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.ink,
  },

  emptyOrderCard: {
    width: "100%",
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.ink,
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.muted,
  },

  metricsContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
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
});
