import { useRouter, type Href } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useState } from "react";
import {
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

// Dados apenas para reproduzir o protótipo do Figma.
// Troque por false para exibir uma Home sem OP selecionada.
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

function ActionButton({ title, secondary = false, onPress }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionButton,
        secondary ? styles.secondaryButton : styles.primaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, secondary ? styles.secondaryText : styles.primaryText]}>
        {title}
      </Text>
    </Pressable>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const selectedOrder = DEMO_MODE ? demoOrder : null;

  function openOrderDetails(value: string) {
    const id = value.trim();
    if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) {
      Alert.alert("Número inválido", "Digite uma OP com letras, números ou hífen.");
      return;
    }
    setSearchOpen(false);
    setOrderNumber("");
    router.push(`/ordem/${encodeURIComponent(id)}` as Href);
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>PRODSYNC / JM FORROS</Text>
        <Text style={styles.pageTitle}>Início</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Bom dia, Carlos.</Text>

        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>
            {DEMO_MODE
              ? "✓ Sankhya disponível · simulado"
              : "Sankhya ainda não conectado"}
          </Text>
        </View>

        <ActionButton title="Consultar OP" onPress={() => setSearchOpen(true)} />
        <ActionButton
          title="Ler código da OP"
          secondary
          onPress={() => router.push("/(tabs)/bipagem")}
        />

        <Text style={styles.sectionTitle}>Ordem selecionada</Text>

        {selectedOrder ? (
          <Pressable
            style={styles.orderCard}
            onPress={() => openOrderDetails(selectedOrder.number)}
          >
            <Text style={styles.orderTitle}>OP {selectedOrder.number}</Text>
            <Text style={styles.orderDescription}>
              {selectedOrder.product} · {selectedOrder.code}
            </Text>
            <Text style={styles.orderStatus}>● {selectedOrder.status}</Text>
            <Text style={styles.orderHint}>Toque para acompanhar a ordem (teste)</Text>
          </Pressable>
        ) : (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>Nenhuma ordem selecionada</Text>
            <Text style={styles.orderDescription}>
              Consulte uma OP para visualizar as informações.
            </Text>
          </View>
        )}

        <View style={styles.metricsContainer}>
          <MetricCard
            value={selectedOrder ? String(selectedOrder.quantity) : "—"}
            label={selectedOrder ? "peças · OP 0148" : "peças produzidas"}
          />
          <MetricCard
            value={selectedOrder ? String(selectedOrder.pendingPackages) : "—"}
            label="pacotes a validar"
          />
        </View>

        <ActionButton
          title="Validar pacotes"
          secondary
          onPress={() => router.push("/(tabs)/bipagem")}
        />

        <Text style={styles.demoNotice}>
          Demonstração · Dados e conexões simulados
        </Text>
      </ScrollView>

      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consultar OP</Text>
              <Pressable onPress={() => setSearchOpen(false)}>
                <X color={theme.ink} size={24} />
              </Pressable>
            </View>
            <Text style={styles.modalDescription}>
              Digite o número de uma ordem para abrir a tela de detalhes em
              modo de demonstração.
            </Text>
            <TextInput
              value={orderNumber}
              onChangeText={setOrderNumber}
              placeholder="Ex.: 10245"
              placeholderTextColor={theme.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.searchInput}
              onSubmitEditing={() => openOrderDetails(orderNumber)}
            />
            <Pressable
              style={styles.modalPrimary}
              onPress={() => openOrderDetails(orderNumber)}
            >
              <Search color={theme.white} size={19} />
              <Text style={styles.primaryText}>Abrir OP (teste)</Text>
            </Pressable>
            <Pressable
              style={styles.modalSecondary}
              onPress={() => {
                setSearchOpen(false);
                router.push("/(tabs)/ordens");
              }}
            >
              <Text style={styles.secondaryText}>Ver todas as ordens</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 24, paddingVertical: 24, gap: 4 },
  brand: { fontSize: 12, lineHeight: 20, fontWeight: "500", color: theme.teal },
  pageTitle: { fontSize: 28, lineHeight: 36, fontWeight: "700", color: theme.ink },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 24, gap: 16 },
  greeting: { fontSize: 28, lineHeight: 36, fontWeight: "700", color: theme.ink },
  connectionStatus: {
    backgroundColor: theme.successBg, borderRadius: 12, padding: 8,
    minHeight: 36, justifyContent: "center",
  },
  connectionText: { fontSize: 12, lineHeight: 20, fontWeight: "500", color: theme.success },
  actionButton: {
    height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  primaryButton: { backgroundColor: theme.navy },
  secondaryButton: { backgroundColor: theme.white },
  actionText: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  primaryText: { color: theme.white, fontSize: 16, fontWeight: "600" },
  secondaryText: { color: theme.navy, fontSize: 16, fontWeight: "600" },
  pressed: { opacity: 0.75 },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: theme.ink },
  orderCard: {
    backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, padding: 16, gap: 8,
  },
  orderTitle: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: theme.ink },
  orderDescription: { fontSize: 16, lineHeight: 24, color: theme.muted },
  orderStatus: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: theme.ink },
  orderHint: { fontSize: 16, lineHeight: 24, color: theme.ink },
  metricsContainer: { flexDirection: "row", gap: 16 },
  metricCard: {
    flex: 1, minWidth: 0, minHeight: 110, backgroundColor: theme.white,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, gap: 8,
  },
  metricValue: { fontSize: 40, lineHeight: 48, fontWeight: "700", color: theme.ink },
  metricLabel: { fontSize: 12, lineHeight: 20, fontWeight: "500", color: theme.muted },
  demoNotice: {
    fontSize: 12, lineHeight: 20, color: theme.muted, textAlign: "center",
  },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(7,17,31,0.65)",
    justifyContent: "center", padding: 24,
  },
  modalCard: { backgroundColor: theme.white, borderRadius: 18, padding: 20, gap: 16 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  modalTitle: { color: theme.ink, fontSize: 20, fontWeight: "700" },
  modalDescription: { color: theme.muted, fontSize: 14, lineHeight: 21 },
  searchInput: {
    height: 54, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, paddingHorizontal: 16, fontSize: 16,
    color: theme.ink, backgroundColor: theme.background,
  },
  modalPrimary: {
    minHeight: 54, borderRadius: 12, backgroundColor: theme.navy,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  modalSecondary: {
    minHeight: 54, borderRadius: 12, backgroundColor: theme.white,
    borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center",
  },
});
