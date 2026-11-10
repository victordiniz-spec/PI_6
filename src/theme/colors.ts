import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

// Mantém as cores existentes para não quebrar as telas do PRODSYNC.
// As demais telas ainda podem importar `colors` normalmente.
export const colors = {
  navy: {
    500: "#214B73",
    600: "#1B4268",
    700: "#173A5C",
    800: "#12314E",
    900: "#0B2238",
  },
  primary: {
    50: "#EEF7FC",
    100: "#D9EEF8",
    200: "#BCE4F2",
    500: "#00AFCB",
    600: "#009BB5",
    700: "#087A95",
  },
  background: "#E3E9F0",
  surface: "#FFFFFF",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  text: {
    primary: "#0F172A",
    secondary: "#64748B",
    muted: "#94A3B8",
  },
} as const;

export type Appearance = "light" | "dark";

// Paletas dinâmicas usadas pela aba Mais e pela navegação inferior.
export const palettes = {
  light: {
    background: colors.background,
    surface: colors.surface,
    surfaceAlt: "#EDF3F8",
    text: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    border: "#D1DCE6",
    navy: colors.navy[700],
    accent: colors.primary[600],
    activeTab: "#DDF4F7",
    success: colors.success,
    successBg: "#E8F7EE",
    danger: colors.danger,
    dangerBg: "#FEF0F0",
    switchTrack: colors.primary[600],
  },
  dark: {
    background: "#101B2B",
    surface: "#1B2A40",
    surfaceAlt: "#2A3D56",
    text: "#F8FAFC",
    secondary: "#B5C3D5",
    muted: "#94A3B8",
    border: "#344861",
    navy: "#D4E8FA",
    accent: "#63D5E5",
    activeTab: "#294A63",
    success: "#70D5AA",
    successBg: "#173C36",
    danger: "#FDA4A4",
    dangerBg: "#4B2733",
    switchTrack: "#00AFCB",
  },
} as const;

export type AppPalette = {
  [K in keyof typeof palettes.light]: string;
};

type AppThemeContextValue = {
  appearance: Appearance;
  palette: AppPalette;
  ready: boolean;
  setAppearance: (next: Appearance) => Promise<void>;
};

const APPEARANCE_KEY = "prodsync_appearance";
const ThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    SecureStore.getItemAsync(APPEARANCE_KEY)
      .then((saved) => {
        if (active && (saved === "light" || saved === "dark")) {
          setAppearanceState(saved);
        }
      })
      .catch(() => {
        // Sem preferência salva, permanece no modo claro.
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setAppearance = useCallback(async (next: Appearance) => {
    await SecureStore.setItemAsync(APPEARANCE_KEY, next);
    setAppearanceState(next);
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      appearance,
      palette: palettes[appearance],
      ready,
      setAppearance,
    }),
    [appearance, ready, setAppearance],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme precisa de AppThemeProvider no layout.");
  }
  return context;
}

// Tons reutilizáveis nas telas operacionais.
export function getOperationalColors(p: AppPalette) {
  const dark = p.background === palettes.dark.background;
  return {
    navy: dark ? '#D4E8FA' : '#17395C',
    navyDark: dark ? '#B5CDE5' : '#112E4D',
    blue: p.accent,
    bg: p.background,
    white: p.surface,
    ink: p.text,
    muted: p.secondary,
    border: p.border,
    soft: p.surfaceAlt,
    success: p.success,
    successBg: p.successBg,
    warning: dark ? '#F4C27D' : '#9A5B0A',
    warningBg: dark ? '#4B3825' : '#FFF3DE',
    danger: p.danger,
    dangerBg: p.dangerBg,
    onPrimary: '#FFFFFF',
  };
}
export type OperationalColors = ReturnType<typeof getOperationalColors>;
