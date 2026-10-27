
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

export default function MaisScreen() {
  const router = useRouter();

  function handleLogout() {
    Alert.alert(
      "Sair da conta",
      "Deseja realmente sair do PRODSYNC?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => router.replace("/"),
        },
      ]
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
      }}
    >
      <Pressable
        onPress={handleLogout}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          gap: 12,
        }}
      >
        <LogOut
          size={22}
          color="#DC2626"
        />

        <Text
          style={{
            color: "#DC2626",
            fontSize: 15,
            fontWeight: "600",
          }}
        >
          Sair da conta
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
