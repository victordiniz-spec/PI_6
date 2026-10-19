
import { Tabs } from "expo-router";
import {
  House,
  List,
  ScanLine,
  Ellipsis,
} from "lucide-react-native";

import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const bottomPadding =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, 20);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#17395C",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },

        tabBarIconStyle: {
          marginTop: 2,
        },

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,

          // Espaço para os botões do Android
          paddingBottom: bottomPadding,

          // Altura considerando a área segura
          height: 58 + bottomPadding,

          paddingTop: 6,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ordens"
        options={{
          title: "Ordens",
          tabBarIcon: ({ color, size }) => (
            <List size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bipagem"
        options={{
          title: "Bipagem",
          tabBarIcon: ({ color, size }) => (
            <ScanLine size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: ({ color, size }) => (
            <Ellipsis size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
