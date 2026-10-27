import { useState } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ClipboardList, QrCode, Search, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

export default function HomeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [orderNumber, setOrderNumber] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);

  function openOrder(value: string) {
    const id = value.match(/[0-9A-Za-z-]+/g)?.at(-1) ?? "";
    if (!id) return;
    setScannerOpen(false);
    setScanned(false);
    router.push({ pathname: "/ordem/[id]", params: { id } });
  }

  function searchOrder() {
    const value = orderNumber.trim().replace(/[^0-9A-Za-z-]/g, "");
    if (value) openOrder(value);
  }

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanned(false);
    setScannerOpen(true);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ color: colors.navy[700], fontSize: 28, fontWeight: "800" }}>Olá, operador</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 15, marginTop: 6 }}>Localize uma ordem para começar a produção.</Text>
        </View>
        <Pressable onPress={openScanner} style={{ backgroundColor: colors.navy[700], borderRadius: 20, padding: 22, minHeight: 150, justifyContent: "space-between" }}>
          <QrCode size={38} color="#FFFFFF" />
          <View><Text style={{ color: "white", fontSize: 21, fontWeight: "800" }}>Ler código da OP</Text><Text style={{ color: "#D9EEF8", marginTop: 5 }}>Abre a câmera aqui para ler o QR Code da ordem</Text></View>
        </Pressable>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 12 }}>
          <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: "800" }}>Digitar número da OP</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput value={orderNumber} onChangeText={setOrderNumber} onSubmitEditing={searchOrder} placeholder="Ex.: 10245" placeholderTextColor={colors.text.muted} style={{ flex: 1, height: 54, borderWidth: 1, borderColor: "#B8C3D1", borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#F8FAFC" }} />
            <Pressable onPress={searchOrder} style={{ width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary[500] }}><Search size={24} color="white" /></Pressable>
          </View>
          <Text style={{ color: colors.text.secondary, fontSize: 13 }}>Ao pesquisar, você irá direto para os detalhes da OP.</Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/ordens")} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#CBD5E1" }}>
          <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.primary[50], alignItems: "center", justifyContent: "center" }}><ClipboardList size={25} color={colors.navy[600]} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.text.primary, fontSize: 17, fontWeight: "700" }}>Ver ordens de produção</Text><Text style={{ color: colors.text.secondary, marginTop: 3 }}>Consulte todas as ordens disponíveis</Text></View>
          <Text style={{ color: colors.navy[600], fontSize: 24 }}>›</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={scannerOpen} animationType="fade" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "#07111F" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : ({ data }) => { setScanned(true); openOrder(data); }}
          />
          <View pointerEvents="none" style={{ position: "absolute", left: 35, right: 35, top: "28%", height: 280, borderWidth: 3, borderColor: colors.primary[500], borderRadius: 24 }} />
          <Pressable onPress={() => setScannerOpen(false)} style={{ position: "absolute", top: 54, right: 24, width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}><X size={27} color="white" /></Pressable>
          <View style={{ position: "absolute", left: 24, right: 24, bottom: 54, backgroundColor: "rgba(7,17,31,0.82)", borderRadius: 16, padding: 18 }}><Text style={{ color: "white", textAlign: "center", fontSize: 18, fontWeight: "800" }}>Aponte para o QR Code da OP</Text><Text style={{ color: "#CBD5E1", textAlign: "center", marginTop: 6 }}>Após a leitura, a ordem será aberta automaticamente.</Text></View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
