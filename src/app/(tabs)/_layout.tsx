import { Tabs } from "expo-router";
import { Ellipsis, House, List, ScanLine } from "lucide-react-native";
import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";
import { Platform, StyleSheet, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppThemeProvider, useAppTheme } from "@/theme/colors";

type TabIconProps = {
  color: ColorValue;
  focused: boolean;
  IconComponent: ComponentType<LucideProps>;
  activeBackground: string;
};

function TabIcon({ color, focused, IconComponent, activeBackground }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && { backgroundColor: activeBackground }]}>
      <IconComponent size={24} color={color} strokeWidth={1.8} />
    </View>
  );
}

function InnerTabs() {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const bottomPadding = Platform.OS === "android"
    ? Math.max(insets.bottom, 12)
    : Math.max(insets.bottom, 20);

  const itemIcon = (IconComponent: ComponentType<LucideProps>) =>
    ({ color, focused }: { color: ColorValue; focused: boolean }) => (
      <TabIcon
        color={color}
        focused={focused}
        IconComponent={IconComponent}
        activeBackground={palette.activeTab}
      />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.navy,
        tabBarInactiveTintColor: palette.secondary,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          elevation: 0,
          height: 66 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginTop: 3 },
        tabBarIconStyle: { marginTop: 2 },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: itemIcon(House) }} />
      <Tabs.Screen name="ordens" options={{ title: "Ordens", tabBarIcon: itemIcon(List) }} />
      <Tabs.Screen name="bipagem" options={{ title: "Bipagem", tabBarIcon: itemIcon(ScanLine) }} />
      <Tabs.Screen name="mais" options={{ title: "Mais", tabBarIcon: itemIcon(Ellipsis) }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <AppThemeProvider>
      <InnerTabs />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 60,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
