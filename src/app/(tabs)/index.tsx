import { useState } from "react";
import { useRouter } from "expo-router";
import { ClipboardList, QrCode, Search } from "lucide-react-native";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

export default function HomeScreen() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  function searchOrder() {
    const value = orderNumber.trim().replace(/[^0-9A-Za-z-]/g, "");
    if (value) router.push({ pathname: "/ordem/[id]", params: { id: value } });
  }
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ color: colors.navy[700], fontSize: 28, fontWeight: "800" }}>Olá, operador</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 15, marginTop: 6 }}>Localize uma ordem para começar a produção.</Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: "/(tabs)/ordens", params: { scan: "1" } })} style={{ backgroundColor: colors.navy[700], borderRadius: 20, padding: 22, minHeight: 150, justifyContent: "space-between" }}>
          <QrCode size={38} color="#FFFFFF" />
          <View><Text style={{ color: "white", fontSize: 21, fontWeight: "800" }}>Ler código da OP</Text><Text style={{ color: "#D9EEF8", marginTop: 5 }}>Aponte a câmera para o QR Code da ordem de produção</Text></View>
        </Pressable>
        <View style={{ backgroundColor: "white", borderRadius: 20, padding: 18, gap: 12 }}>
          <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: "800" }}>Digitar número da OP</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput value={orderNumber} onChangeText={setOrderNumber} onSubmitEditing={searchOrder} placeholder="Ex.: 10245" placeholderTextColor={colors.text.muted} style={{ flex: 1, height: 54, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, paddingHorizontal: 16, fontSize: 16 }} />
            <Pressable onPress={searchOrder} style={{ width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary[500] }}><Search size={24} color="white" /></Pressable>
          </View>
          <Text style={{ color: colors.text.secondary, fontSize: 13 }}>Ao pesquisar, você irá direto para os detalhes da OP.</Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/ordens")} style={{ backgroundColor: "white", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#E2E8F0" }}>
          <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.primary[50], alignItems: "center", justifyContent: "center" }}><ClipboardList size={25} color={colors.navy[600]} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.text.primary, fontSize: 17, fontWeight: "700" }}>Ver ordens de produção</Text><Text style={{ color: colors.text.secondary, marginTop: 3 }}>Consulte todas as ordens disponíveis</Text></View>
          <Text style={{ color: colors.navy[600], fontSize: 24 }}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

