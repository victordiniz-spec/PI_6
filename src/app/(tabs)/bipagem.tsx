import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, QrCode, ScanLine, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

export default function BipagemScreen() {
  const router = useRouter();
  const { op = "10245" } = useLocalSearchParams<{ op?: string }>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(18);

  function confirmLabel() {
    setConfirmed((value) => value + 1);
    setScannerOpen(false);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={23} color={colors.navy[700]} /></Pressable>
          <View><Text style={{ color: colors.text.secondary }}>Bipagem de etiquetas</Text><Text style={{ color: colors.navy[700], fontSize: 26, fontWeight: "800" }}>OP #{op}</Text></View>
        </View>

        <View style={{ backgroundColor: colors.navy[700], borderRadius: 20, padding: 20 }}>
          <Text style={{ color: "white", fontSize: 19, fontWeight: "800" }}>Produto Acabado A</Text>
          <Text style={{ color: "#CBD5E1", marginTop: 6 }}>A OP foi identificada pelo QR Code</Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 14 }}><Text style={{ color: "#CBD5E1" }}>Concluídas</Text><Text style={{ color: "white", fontSize: 26, fontWeight: "800", marginTop: 4 }}>{confirmed}</Text></View>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 14 }}><Text style={{ color: "#CBD5E1" }}>Pendentes</Text><Text style={{ color: "white", fontSize: 26, fontWeight: "800", marginTop: 4 }}>{Math.max(0, 25 - confirmed)}</Text></View>
          </View>
        </View>

        <Pressable onPress={() => setScannerOpen(true)} style={{ minHeight: 180, borderRadius: 20, backgroundColor: colors.primary[500], padding: 22, justifyContent: "space-between" }}>
          <ScanLine size={42} color="white" />
          <View><Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>Ler etiqueta</Text><Text style={{ color: "#E0F7FB", marginTop: 6 }}>Abra a câmera e aponte para o QR Code da etiqueta</Text></View>
        </Pressable>

        <Pressable onPress={() => router.push({ pathname: "/ordem/[id]", params: { id: op } })} style={{ height: 54, borderRadius: 12, backgroundColor: "white", borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.navy[700], fontWeight: "800" }}>Ver detalhes da OP</Text></Pressable>
      </ScrollView>

      <Modal visible={scannerOpen} transparent animationType="fade" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,12,24,0.95)", padding: 24, justifyContent: "center" }}>
          <Pressable onPress={() => setScannerOpen(false)} style={{ position: "absolute", top: 54, right: 24 }}><X size={30} color="white" /></Pressable>
          <View style={{ height: 300, borderWidth: 3, borderColor: colors.primary[500], borderRadius: 24, alignItems: "center", justifyContent: "center" }}><QrCode size={110} color="white" /></View>
          <Text style={{ color: "white", textAlign: "center", fontSize: 20, fontWeight: "800", marginTop: 26 }}>Aponte a câmera para o QR Code da etiqueta</Text>
          <Text style={{ color: "#CBD5E1", textAlign: "center", marginTop: 8 }}>Mantenha o código dentro do quadro.</Text>
          <Pressable onPress={confirmLabel} style={{ height: 54, borderRadius: 12, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginTop: 24, flexDirection: "row", gap: 8 }}><CheckCircle2 size={21} color="white" /><Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Simular etiqueta reconhecida</Text></Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

