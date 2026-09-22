import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-navy-700">
      <Text className="text-3xl font-bold text-white">
        PRODSYNC
      </Text>

      <Text className="mt-2 text-base text-primary-100">
        Controle de Produção
      </Text>
    </View>
  );
}