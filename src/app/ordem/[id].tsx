import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, CirclePause, Play, Printer, QrCode, ScanLine, Square, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [status, setStatus] = useState("Liberada");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<"completed" | "unscanned" | "unprinted" | null>(null);
  const [reprintNotice, setReprintNotice] = useState("");
  const [scanMessage, setScanMessage] = useState("Aponte a câmera para o QR Code da etiqueta");
  const quantity = id === "10246" ? 800 : id === "10247" ? 450 : 1200;
  const actions = [
    { title: "Iniciar produção", icon: Play, color: colors.success, onPress: () => setStatus("Em produção") },
    { title: "Registrar parada", icon: CirclePause, color: colors.warning, onPress: () => setStatus("Parada") },
    { title: "Finalizar produção", icon: Square, color: colors.danger, onPress: () => setStatus("Finalizada") },
  ];
  const labelSummary = [
    { key: "completed" as const, label: "Concluídas", value: 18, icon: CheckCircle2, color: colors.success },
    { key: "unscanned" as const, label: "Não bipadas", value: 7, icon: ScanLine, color: colors.warning },
    { key: "unprinted" as const, label: "Não impressas", value: 5, icon: Printer, color: colors.danger },
  ];
  const selectedSummary = labelSummary.find((item) => item.key === selectedLabels);
  const visibleLabels = Array.from({ length: selectedSummary?.value ?? 0 }, (_, index) => ({
    code: `ETQ-${id}-${String(index + 1).padStart(3, "0")}`,
    package: `Pacote ${String(index + 1).padStart(2, "0")}`,
  }));

  function simulateScan() {
    setScanMessage("Etiqueta apontada e validada com sucesso!");
    setTimeout(() => { setScannerOpen(false); setScanMessage("Aponte a câmera para o QR Code da etiqueta"); }, 1400);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={23} color={colors.navy[700]} /></Pressable>
          <View><Text style={{ color: colors.text.secondary }}>Ordem de produção</Text><Text style={{ color: colors.navy[700], fontSize: 26, fontWeight: "800" }}>OP #{id}</Text></View>
        </View>

        <View style={{ backgroundColor: colors.navy[700], borderRadius: 20, padding: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: "white", fontSize: 19, fontWeight: "700" }}>Produto Acabado A</Text><Text style={{ color: "#7CE0B0", fontWeight: "800" }}>{status}</Text></View>
          <Text style={{ color: "#CBD5E1", marginTop: 8 }}>Código: PROD-001</Text>
          <View style={{ flexDirection: "row", marginTop: 22 }}>
            <View style={{ flex: 1 }}><Text style={{ color: "#CBD5E1" }}>Planejada</Text><Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>{quantity}</Text></View>
            <View style={{ flex: 1 }}><Text style={{ color: "#CBD5E1" }}>Produzida</Text><Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>0</Text></View>
            <View style={{ flex: 1 }}><Text style={{ color: "#CBD5E1" }}>Pendente</Text><Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>{quantity}</Text></View>
          </View>
        </View>

        <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: "800", marginTop: 4 }}>Ações da produção</Text>
        {actions.map(({ title, icon: Icon, color, onPress }) => (
          <Pressable key={title} onPress={onPress} style={{ backgroundColor: "white", borderRadius: 15, padding: 17, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#E2E8F0" }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}><Icon size={24} color={color} /></View>
            <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: "700", flex: 1 }}>{title}</Text><Text style={{ color: colors.text.muted, fontSize: 24 }}>›</Text>
          </Pressable>
        ))}

        <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: "800", marginTop: 4 }}>Etiquetas</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {labelSummary.map(({ key, label, value, icon: Icon, color }) => (
            <Pressable key={label} onPress={() => { setSelectedLabels(key); setReprintNotice(""); }} style={{ flex: 1, minHeight: 112, backgroundColor: "white", borderRadius: 15, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Icon size={22} color={color} /><Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: "800", marginTop: 10 }}>{value}</Text><Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable style={{ flex: 1, minHeight: 110, backgroundColor: colors.primary[500], borderRadius: 16, padding: 16, justifyContent: "space-between" }}><Printer size={28} color="white" /><Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Emitir etiqueta</Text></Pressable>
          <Pressable onPress={() => setScannerOpen(true)} style={{ flex: 1, minHeight: 110, backgroundColor: "white", borderRadius: 16, padding: 16, justifyContent: "space-between", borderWidth: 1, borderColor: "#CBD5E1" }}><ScanLine size={28} color={colors.navy[700]} /><Text style={{ color: colors.navy[700], fontWeight: "800", fontSize: 16 }}>Ler etiqueta</Text></Pressable>
        </View>
      </ScrollView>

      <Modal visible={scannerOpen} transparent animationType="fade" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,12,24,0.95)", padding: 24, justifyContent: "center" }}>
          <Pressable onPress={() => setScannerOpen(false)} style={{ position: "absolute", top: 54, right: 24 }}><X size={30} color="white" /></Pressable>
          <View style={{ height: 300, borderWidth: 3, borderColor: scanMessage.includes("sucesso") ? colors.success : colors.primary[500], borderRadius: 24, alignItems: "center", justifyContent: "center" }}>
            {scanMessage.includes("sucesso") ? <CheckCircle2 size={108} color={colors.success} /> : <QrCode size={110} color="white" />}
          </View>
          <Text style={{ color: "white", textAlign: "center", fontSize: 20, fontWeight: "800", marginTop: 26 }}>{scanMessage}</Text>
          <Text style={{ color: "#CBD5E1", textAlign: "center", marginTop: 8 }}>A leitura será feita pela câmera no aplicativo Android.</Text>
          <Pressable onPress={simulateScan} style={{ height: 54, borderRadius: 12, backgroundColor: colors.primary[500], alignItems: "center", justifyContent: "center", marginTop: 24 }}><Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Simular leitura da etiqueta</Text></Pressable>
        </View>
      </Modal>

      <Modal visible={selectedLabels !== null} transparent animationType="slide" onRequestClose={() => setSelectedLabels(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, maxHeight: "78%", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View><Text style={{ color: colors.navy[700], fontSize: 23, fontWeight: "800" }}>{selectedSummary?.label}</Text><Text style={{ color: colors.text.secondary, marginTop: 3 }}>{selectedSummary?.value} etiquetas da OP #{id}</Text></View>
              <Pressable onPress={() => setSelectedLabels(null)} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}><X size={22} color={colors.navy[700]} /></Pressable>
            </View>
            {reprintNotice ? <View style={{ backgroundColor: "#DCFCE7", borderRadius: 12, padding: 12, marginTop: 12 }}><Text style={{ color: "#166534", fontWeight: "700" }}>{reprintNotice}</Text></View> : null}
            <ScrollView style={{ marginTop: 14 }} contentContainerStyle={{ gap: 10, paddingBottom: 28 }}>
              {visibleLabels.map((label) => (
                <View key={label.code} style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", padding: 15, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <QrCode size={28} color={colors.navy[700]} />
                  <View style={{ flex: 1 }}><Text style={{ color: colors.text.primary, fontWeight: "800" }}>{label.code}</Text><Text style={{ color: colors.text.secondary, marginTop: 3 }}>{label.package}</Text></View>
                  {selectedLabels === "unscanned" ? (
                    <Pressable onPress={() => setReprintNotice(`${label.code} enviada para reimpressão.`)} style={{ borderRadius: 10, backgroundColor: colors.primary[50], paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", gap: 6, alignItems: "center" }}><Printer size={17} color={colors.navy[700]} /><Text style={{ color: colors.navy[700], fontWeight: "800", fontSize: 12 }}>Reimprimir</Text></Pressable>
                  ) : (
                    <Text style={{ color: colors.text.muted, fontSize: 12 }}>Somente consulta</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

