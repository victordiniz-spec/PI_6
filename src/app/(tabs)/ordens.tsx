
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdensScreen() {
  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: "#F1F5F9",
      }}
    >
      <View style={{ flex: 1 }} />
    </SafeAreaView>
  );
}
