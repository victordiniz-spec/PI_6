
import { Tabs } from "expo-router";

import {
  Ellipsis,
  House,
  List,
  ScanLine,
} from "lucide-react-native";

import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";

import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

// Cores utilizadas no Figma do PRODSYNC
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

// Componente reutilizável para os ícones
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

// Navegação inferior do PRODSYNC
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Espaço reservado para a navegação do Android/iOS
  const bottomPadding =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, 20);

  return (
    <Tabs
      screenOptions={{
        // Oculta o cabeçalho padrão
        headerShown: false,

        // Cores da navegação
        tabBarActiveTintColor: theme.navy,
        tabBarInactiveTintColor: theme.muted,

        // Estilo da barra inferior
        tabBarStyle: {
          backgroundColor: theme.white,
          borderTopWidth: 0,
          elevation: 0,

          // Altura adaptada à área segura
          height: 66 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },

        // Espaçamento dos itens
        tabBarItemStyle: {
          paddingVertical: 2,
        },

        // Estilo dos nomes das abas
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 3,
        },

        // Espaçamento dos ícones
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* ABA INÍCIO */}
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

      {/* ABA ORDENS */}
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

      {/* ABA BIPAGEM */}
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

      {/* ABA MAIS */}
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

// Estilos dos ícones
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
