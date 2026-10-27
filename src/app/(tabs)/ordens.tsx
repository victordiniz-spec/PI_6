import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { QrCode, Search, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

const orders = [
  { id: "10245", product: "Produto Acabado A", planned: 1200, status: "Liberada" },
  { id: "10246", product: "Produto Acabado B", planned: 800, status: "Em produção" },
  { id: "10247", product: "Produto Acabado C", planned: 450, status: "Pendente" },
];

export default function OrdensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scan?: string }>();
  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(params.scan === "1");
  const visibleOrders = orders.filter((order) => `${order.id} ${order.product}`.toLowerCase().includes(query.toLowerCase()));
  function search() { const value = query.trim().replace(/[^0-9A-Za-z-]/g, ""); if (value) router.push({ pathname: "/ordem/[id]", params: { id: value } }); }
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View><Text style={{ color: colors.navy[700], fontSize: 27, fontWeight: "800" }}>Ordens de produção</Text><Text style={{ color: colors.text.secondary, marginTop: 4 }}>Selecione uma OP para ver os detalhes</Text></View>
          <Pressable onPress={() => setScannerOpen(true)} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.navy[700], alignItems: "center", justifyContent: "center" }}><QrCode size={25} color="white" /></Pressable>
        </View>
        <View style={{ flexDirection: "row", backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", paddingHorizontal: 14 }}><Search size={20} color={colors.text.muted} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Número da OP ou produto" placeholderTextColor={colors.text.muted} style={{ flex: 1, height: 54, paddingHorizontal: 10, fontSize: 16 }} /></View>
        {visibleOrders.map((order) => (
          <Pressable key={order.id} onPress={() => router.push({ pathname: "/ordem/[id]", params: { id: order.id } })} style={{ backgroundColor: "white", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#E2E8F0" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ color: colors.navy[700], fontSize: 19, fontWeight: "800" }}>OP #{order.id}</Text><Text style={{ color: order.status === "Em produção" ? colors.success : colors.warning, fontWeight: "700", fontSize: 12 }}>{order.status}</Text></View>
            <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: "600", marginTop: 12 }}>{order.product}</Text><Text style={{ color: colors.text.secondary, marginTop: 5 }}>Quantidade planejada: {order.planned.toLocaleString("pt-BR")}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Modal visible={scannerOpen} transparent animationType="fade" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,12,24,0.92)", padding: 24, justifyContent: "center" }}>
          <Pressable onPress={() => setScannerOpen(false)} style={{ position: "absolute", top: 54, right: 24 }}><X size={30} color="white" /></Pressable>
          <View style={{ height: 280, borderWidth: 3, borderColor: colors.primary[500], borderRadius: 24, alignItems: "center", justifyContent: "center" }}><QrCode size={110} color="#FFFFFF" /></View>
          <Text style={{ color: "white", textAlign: "center", fontSize: 20, fontWeight: "700", marginTop: 26 }}>Posicione o QR Code da OP no quadro</Text><Text style={{ color: "#CBD5E1", textAlign: "center", marginTop: 8 }}>Na prévia web, use o botão abaixo para simular uma leitura.</Text>
          <Pressable onPress={() => { setScannerOpen(false); router.push({ pathname: "/ordem/[id]", params: { id: "10245" } }); }} style={{ height: 54, borderRadius: 12, backgroundColor: colors.primary[500], alignItems: "center", justifyContent: "center", marginTop: 24 }}><Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Simular leitura da OP 10245</Text></Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

