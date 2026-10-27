import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Print from "expo-print";
import { ArrowLeft, CheckCircle2, CirclePause, Play, Printer, QrCode, ScanLine, Square, X } from "lucide-react-native";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

type LabelStatus = "used" | "printed" | "unprinted";
type ProductionLabel = { id: string; lot: string; quantity: number; status: LabelStatus };

const initialLabels: ProductionLabel[] = Array.from({ length: 30 }, (_, index) => ({
  id: String(457655 + index),
  lot: "009516/1026",
  quantity: 1,
  status: index < 18 ? "used" : index < 25 ? "printed" : "unprinted",
}));

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [status, setStatus] = useState("Liberada");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [labels, setLabels] = useState(initialLabels);
  const [selectedLabels, setSelectedLabels] = useState<"completed" | "unscanned" | "unprinted" | null>(null);
  const [reprintNotice, setReprintNotice] = useState("");
  const [scanMessage, setScanMessage] = useState("Aponte a câmera para o QR Code da etiqueta");
  const [scrapKg, setScrapKg] = useState("");
  const [scrapReason, setScrapReason] = useState("");
  const [scrapObservation, setScrapObservation] = useState("");
  const [scrapEntries, setScrapEntries] = useState<Array<{ id: number; kg: string; reason: string; observation: string }>>([]);
  const quantity = id === "10246" ? 800 : id === "10247" ? 450 : 1200;
  const actions = [
    { title: "Iniciar produção", icon: Play, color: colors.success, onPress: () => setStatus("Em produção") },
    { title: "Registrar parada", icon: CirclePause, color: colors.warning, onPress: () => setStatus("Parada") },
    { title: "Finalizar produção", icon: Square, color: colors.danger, onPress: finalizeProduction },
  ];
  const labelSummary = [
    { key: "completed" as const, label: "Concluídas", value: labels.filter((label) => label.status === "used").length, icon: CheckCircle2, color: colors.success },
    { key: "unscanned" as const, label: "Não bipadas", value: labels.filter((label) => label.status === "printed").length, icon: ScanLine, color: colors.warning },
    { key: "unprinted" as const, label: "Não impressas", value: labels.filter((label) => label.status === "unprinted").length, icon: Printer, color: colors.danger },
  ];
  const selectedSummary = labelSummary.find((item) => item.key === selectedLabels);
  const statusBySelection = { completed: "used", unscanned: "printed", unprinted: "unprinted" } as const;
  const visibleLabels = selectedLabels ? labels.filter((label) => label.status === statusBySelection[selectedLabels]) : [];

  async function openLabelScanner() {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) {
      Alert.alert("Câmera necessária", "Autorize o uso da câmera para ler o QR Code da etiqueta.");
      return;
    }
    setScanLocked(false);
    setScanMessage("Aponte a câmera para o QR Code da etiqueta");
    setScannerOpen(true);
  }

  function processScannedLabel(rawValue: string) {
    if (scanLocked) return;
    setScanLocked(true);
    const labelId = rawValue.match(/\d+/)?.[0] ?? rawValue.trim();
    const label = labels.find((item) => item.id === labelId);

    if (!label) {
      setScanMessage("Etiqueta não encontrada nesta OP.");
      setTimeout(() => setScanLocked(false), 1800);
      return;
    }
    if (label.status === "used") {
      setScanMessage(`Etiqueta ${labelId} já foi apontada.`);
      setTimeout(() => setScanLocked(false), 1800);
      return;
    }
    if (label.status === "unprinted") {
      setScanMessage(`Etiqueta ${labelId} ainda não foi impressa.`);
      setTimeout(() => setScanLocked(false), 1800);
      return;
    }

    // A API atualizará STATUS, NUAPO, CODUSULEITUR e DHLEITUR pelo ID da etiqueta.
    setLabels((current) => current.map((item) => item.id === labelId ? { ...item, status: "used" } : item));
    setScanMessage(`Etiqueta ${labelId} apontada com sucesso!`);
    setTimeout(() => { setScannerOpen(false); setScanLocked(false); }, 1400);
  }

  async function printLabel(labelId?: string) {
    const target = labelId ? labels.find((label) => label.id === labelId) : labels.find((label) => label.status === "unprinted");
    if (!target) {
      Alert.alert("Sem etiquetas", "Não há etiqueta disponível para impressão nesta OP.");
      return;
    }
    // A API retornará o relatório "ETIQUETA PRODUÇÃO - ID ETIQUETA". São duas vias físicas com o mesmo ID.
    const labelCopy = `<div class="label"><h1>ETIQUETA PRODUÇÃO</h1><div>Ordem de produção: <strong>${id}</strong></div><div>Lote: <strong>${target.lot}</strong></div><div>Quantidade: <strong>${target.quantity}</strong></div><div class="code">ID ETIQUETA: ${target.id}</div></div>`;
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"/><style>@page{margin:8mm}body{font-family:Arial;padding:12px}.copy{break-after:page;page-break-after:always}.copy:last-child{break-after:auto;page-break-after:auto}.label{border:2px solid #111;padding:18px;width:330px}h1{font-size:24px;margin:0 0 12px}.code{font-size:20px;font-weight:bold;margin-top:16px}</style></head><body><div class="copy">${labelCopy}</div><div class="copy">${labelCopy}</div></body></html>`;
    try {
      await Print.printAsync({ html });
      setLabels((current) => current.map((label) => label.id === target.id ? { ...label, status: "printed" } : label));
    } catch {
      Alert.alert("Impressão não concluída", "Não foi possível abrir o sistema de impressão.");
    }
  }

  function addScrapEntry() {
    const normalizedKg = scrapKg.replace(",", ".").trim();
    const kgValue = Number(normalizedKg);
    const reason = scrapReason.trim();
    const observation = scrapObservation.trim();
    if (!Number.isFinite(kgValue) || kgValue <= 0 || !reason) {
      Alert.alert("Dados incompletos", "Informe o peso da sucata em kg e o motivo.");
      return;
    }
    setScrapEntries((current) => [
      ...current,
      { id: Date.now(), kg: kgValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }), reason, observation },
    ]);
    setScrapKg("");
    setScrapReason("");
    setScrapObservation("");
    Alert.alert("Sucata adicionada", "O lançamento foi adicionado imediatamente a esta OP.");
  }

  function finalizeProduction() {
    setStatus("Finalizada");
    Alert.alert("Produção finalizada", "A ordem de produção foi finalizada.");
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
          <Pressable onPress={() => printLabel()} style={{ flex: 1, minHeight: 110, backgroundColor: colors.primary[500], borderRadius: 16, padding: 16, justifyContent: "space-between" }}><Printer size={28} color="white" /><View><Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Emitir etiqueta</Text><Text style={{ color: "#E0F2FE", fontSize: 12, marginTop: 3 }}>2 vias · mesmo ID</Text></View></Pressable>
          <Pressable onPress={openLabelScanner} style={{ flex: 1, minHeight: 110, backgroundColor: "white", borderRadius: 16, padding: 16, justifyContent: "space-between", borderWidth: 1, borderColor: "#CBD5E1" }}><ScanLine size={28} color={colors.navy[700]} /><Text style={{ color: colors.navy[700], fontWeight: "800", fontSize: 16 }}>Ler etiqueta</Text></Pressable>
        </View>

        <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: "800", marginTop: 8 }}>Lançamento de sucata</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 17, gap: 12, borderWidth: 1, borderColor: "#CBD5E1" }}>
          <View>
            <Text style={{ color: colors.text.primary, fontWeight: "700", marginBottom: 7 }}>Peso da sucata (kg)</Text>
            <TextInput value={scrapKg} onChangeText={setScrapKg} keyboardType="decimal-pad" placeholder="Ex.: 2,50" placeholderTextColor={colors.text.muted} style={{ height: 52, borderRadius: 12, borderWidth: 1, borderColor: "#B8C3D1", backgroundColor: "#F8FAFC", paddingHorizontal: 14, fontSize: 16, color: colors.text.primary }} />
          </View>
          <View>
            <Text style={{ color: colors.text.primary, fontWeight: "700", marginBottom: 7 }}>Motivo</Text>
            <TextInput value={scrapReason} onChangeText={setScrapReason} placeholder="Informe o motivo da sucata" placeholderTextColor={colors.text.muted} multiline style={{ minHeight: 82, borderRadius: 12, borderWidth: 1, borderColor: "#B8C3D1", backgroundColor: "#F8FAFC", paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text.primary, textAlignVertical: "top" }} />
          </View>
          <View>
            <Text style={{ color: colors.text.primary, fontWeight: "700", marginBottom: 7 }}>Observação</Text>
            <TextInput value={scrapObservation} onChangeText={setScrapObservation} placeholder="Observação opcional" placeholderTextColor={colors.text.muted} multiline style={{ minHeight: 74, borderRadius: 12, borderWidth: 1, borderColor: "#B8C3D1", backgroundColor: "#F8FAFC", paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text.primary, textAlignVertical: "top" }} />
          </View>
          <Pressable disabled={status === "Finalizada"} onPress={addScrapEntry} style={{ height: 52, borderRadius: 12, backgroundColor: status === "Finalizada" ? "#94A3B8" : colors.navy[700], alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>{status === "Finalizada" ? "OP finalizada" : "Adicionar à lista"}</Text></Pressable>
          <Text style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 19 }}>Ao adicionar, a sucata é lançada imediatamente nesta OP. Não é necessário finalizar a produção.</Text>
        </View>

        {scrapEntries.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.text.secondary, fontWeight: "700" }}>Sucatas lançadas na OP ({scrapEntries.length})</Text>
            {scrapEntries.map((entry, index) => (
              <View key={entry.id} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 15, borderLeftWidth: 4, borderLeftColor: colors.warning, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#FFF7E6", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#9A6200", fontWeight: "800" }}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: "800" }}>{entry.kg} kg</Text><Text style={{ color: colors.text.secondary, marginTop: 3 }}>{entry.reason}</Text>{entry.observation ? <Text style={{ color: colors.text.muted, marginTop: 4, fontSize: 12 }}>Obs.: {entry.observation}</Text> : null}</View>
                <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: "#DCFCE7" }}><Text style={{ color: "#166534", fontSize: 11, fontWeight: "800" }}>Lançada</Text></View>
              </View>
            ))}
            <View style={{ backgroundColor: "#FFF7E6", borderRadius: 12, padding: 13, flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: "#7C5200", fontWeight: "700" }}>Total de sucata</Text><Text style={{ color: "#7C5200", fontWeight: "900" }}>{scrapEntries.reduce((sum, entry) => sum + Number(entry.kg.replace(".", "").replace(",", ".")), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg</Text></View>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={scannerOpen} transparent animationType="fade" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,12,24,0.95)", padding: 24, justifyContent: "center" }}>
          <Pressable onPress={() => setScannerOpen(false)} style={{ position: "absolute", top: 54, right: 24 }}><X size={30} color="white" /></Pressable>
          <View style={{ height: 300, overflow: "hidden", borderWidth: 3, borderColor: scanMessage.includes("sucesso") ? colors.success : scanMessage.includes("já foi") ? colors.danger : colors.primary[500], borderRadius: 24, alignItems: "center", justifyContent: "center" }}>
            {cameraPermission?.granted ? <CameraView style={{ width: "100%", height: "100%" }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={({ data }) => processScannedLabel(data)} /> : <QrCode size={110} color="white" />}
            <View pointerEvents="none" style={{ position: "absolute", width: 190, height: 190, borderRadius: 18, borderWidth: 3, borderColor: "white" }} />
          </View>
          <Text style={{ color: "white", textAlign: "center", fontSize: 20, fontWeight: "800", marginTop: 26 }}>{scanMessage}</Text>
          <Text style={{ color: "#CBD5E1", textAlign: "center", marginTop: 8 }}>Cada ID pode ser apontado somente uma vez.</Text>
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
                <View key={label.id} style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", padding: 15, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <QrCode size={28} color={colors.navy[700]} />
                  <View style={{ flex: 1 }}><Text style={{ color: colors.text.primary, fontWeight: "800" }}>ID {label.id}</Text><Text style={{ color: colors.text.secondary, marginTop: 3 }}>Lote {label.lot} · Qtd. {label.quantity}</Text></View>
                  {selectedLabels === "unscanned" ? (
                    <Pressable onPress={async () => { await printLabel(label.id); setReprintNotice(`Etiqueta ${label.id} aberta no sistema de impressão.`); }} style={{ borderRadius: 10, backgroundColor: colors.primary[50], paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", gap: 6, alignItems: "center" }}><Printer size={17} color={colors.navy[700]} /><Text style={{ color: colors.navy[700], fontWeight: "800", fontSize: 12 }}>Reimprimir</Text></Pressable>
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

