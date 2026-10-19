
import { Tabs } from "expo-router";
import {
  House,
  List,
  ScanLine,
  Ellipsis,
} from "lucide-react-native";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#17395C",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingTop: 7,
          paddingBottom: Platform.OS === "ios" ? 22 : 8,
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
