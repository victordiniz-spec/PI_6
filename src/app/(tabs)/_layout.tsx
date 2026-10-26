
import { Tabs } from "expo-router";

import {
  House,
  List,
  ScanLine,
  Ellipsis,
} from "lucide-react-native";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react-native";

import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

// Cores do Figma
const theme = {
  navy: "#123450",
  muted: "#5B6E7C",
  tealBackground: "#E1F3F2",
  white: "#FFFFFF",
};

// Tipagem dos ícones da navbar
type TabIconProps = {
  color: ColorValue;
  focused: boolean;
  IconComponent: ComponentType<LucideProps>;
};

// Componente dos ícones
function TabIcon({
  color,
  focused,
  IconComponent,
}: TabIconProps) {
  return (
    <View
      style={[
        styles.iconContainer,
        focused && styles.iconSelected,
      ]}
    >
      <IconComponent
        size={24}
        color={color}
        strokeWidth={1.8}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Evita sobreposição com a navegação do Android
  const bottomPadding =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, 20);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,

        // Cores da navbar
        tabBarActiveTintColor: theme.navy,
        tabBarInactiveTintColor: theme.muted,

        // Estilo da barra inferior
        tabBarStyle: {
          backgroundColor: theme.white,
          borderTopWidth: 0,
          elevation: 0,

          height: 66 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 3,
        },

        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              IconComponent={House}
            />
          ),
        }}
      />

      {/* ORDENS */}
      <Tabs.Screen
        name="ordens"
        options={{
          title: "Ordens",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              IconComponent={List}
            />
          ),
        }}
      />

      {/* BIPAGEM */}
      <Tabs.Screen
        name="bipagem"
        options={{
          title: "Bipagem",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              IconComponent={ScanLine}
            />
          ),
        }}
      />

      {/* MAIS */}
      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              IconComponent={Ellipsis}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 60,
    height: 34,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "transparent",
  },

  iconSelected: {
    backgroundColor: theme.tealBackground,
  },
});
