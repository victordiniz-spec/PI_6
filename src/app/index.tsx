import { Boxes, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter, type Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

// A URL deve incluir /api e usar o IP do computador no celular físico.
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "SUPERVISOR" | "OPERADOR";
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  usuario: UsuarioAutenticado;
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const formIsValid = emailIsValid && password.length > 0 && !loading;

  async function handleLogin() {
    if (submitting.current) return;
    if (!emailIsValid || !password) {
      Alert.alert("Dados inválidos", "Informe um e-mail válido e sua senha.");
      return;
    }
    if (!API_URL) {
      Alert.alert("API não configurada", "Configure EXPO_PUBLIC_API_URL no .env do projeto.");
      return;
    }

    submitting.current = true;
    setLoading(true);
    Keyboard.dismiss();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha: password,
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        Alert.alert("Acesso negado", "E-mail ou senha incorretos, ou usuário desativado.");
        return;
      }
      if (!response.ok) {
        Alert.alert("Erro no servidor", `Não foi possível realizar o login (HTTP ${response.status}).`);
        return;
      }

      const data = (await response.json()) as LoginResponse;
      if (
        !data?.accessToken ||
        !data.usuario?.id ||
        !data.usuario?.nome ||
        !data.usuario?.email ||
        !["ADMIN", "SUPERVISOR", "OPERADOR"].includes(data.usuario.perfil)
      ) {
        throw new Error("Resposta de autenticação inválida.");
      }

      try {
        await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.usuario));
      } catch (storageError) {
        await Promise.allSettled([
          SecureStore.deleteItemAsync(TOKEN_KEY),
          SecureStore.deleteItemAsync(USER_KEY),
        ]);
        throw storageError;
      }

      setPassword("");
      setShowPassword(false);
      // Rota real: src/app/autorizacao.tsx.
      // O cast Href contorna tipos antigos até o Expo Router regenerar as rotas.
      router.replace("/autorizacao" as Href);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        Alert.alert("Tempo esgotado", "A API demorou para responder. Verifique a rede.");
      } else {
        console.error("Falha na autenticação:", error);
        Alert.alert(
          "Falha no login",
          "Não foi possível concluir a autenticação. Confira a API e a conexão de rede.",
        );
      }
    } finally {
      clearTimeout(timeoutId);
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.navy[700] }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: colors.navy[700] }}>
            {/* Cabeçalho compacto: deixa o botão Entrar visível em celulares menores. */}
            <View style={{
              minHeight: keyboardVisible ? 76 : 170,
              flexGrow: keyboardVisible ? 0 : 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingVertical: keyboardVisible ? 8 : 20,
            }}>
              <View style={{
                height: keyboardVisible ? 38 : 58,
                width: keyboardVisible ? 38 : 58,
                borderRadius: 15,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Boxes size={keyboardVisible ? 23 : 32} color={colors.primary[100]} strokeWidth={1.8} />
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: keyboardVisible ? 20 : 28, fontWeight: "800", marginTop: 8 }}>
                PRODSYNC
              </Text>
              {!keyboardVisible && (
                <>
                  <Text style={{ color: colors.primary[100], fontSize: 15, marginTop: 3 }}>
                    Controle de Produção
                  </Text>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    marginTop: 13,
                    paddingHorizontal: 17,
                    paddingVertical: 8,
                  }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 8, backgroundColor: colors.primary[500] }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>JM FORROS</Text>
                  </View>
                </>
              )}
            </View>

            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: keyboardVisible ? 15 : 24,
              paddingBottom: keyboardVisible ? 24 : 28,
            }}>
              <Text style={{ color: "#0F172A", fontSize: 21, fontWeight: "800" }}>Entrar na sua conta</Text>
              <Text style={{ color: "#64748B", fontSize: 13, marginTop: 5, lineHeight: 19 }}>
                Utilize as credenciais cadastradas no PRODSYNC ERP.
              </Text>

              <View style={{ marginTop: 20 }}>
                <Text style={{ color: "#172F42", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>E-mail</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", minHeight: 52,
                  backgroundColor: "#FFFFFF", borderWidth: 1,
                  borderColor: email.length > 0 && !emailIsValid ? "#DC2626" : "#CBD5E1",
                  borderRadius: 12, paddingHorizontal: 13,
                }}>
                  <Mail size={20} color="#64748B" />
                  <TextInput
                    style={{ flex: 1, color: "#172F42", fontSize: 16, minHeight: 50, marginLeft: 10 }}
                    placeholder="Digite seu e-mail"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="username"
                    returnKeyType="next"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
                {email.length > 0 && !emailIsValid && (
                  <Text style={{ color: "#DC2626", fontSize: 12, marginTop: 5 }}>Informe um e-mail válido.</Text>
                )}
              </View>

              <View style={{ marginTop: 17 }}>
                <Text style={{ color: "#172F42", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>Senha</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", minHeight: 52,
                  backgroundColor: "#FFFFFF", borderWidth: 1,
                  borderColor: "#CBD5E1", borderRadius: 12, paddingHorizontal: 13,
                }}>
                  <LockKeyhole size={20} color="#64748B" />
                  <TextInput
                    style={{ flex: 1, color: "#172F42", fontSize: 16, minHeight: 50, marginLeft: 10 }}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="done"
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    onSubmitEditing={() => {
                      if (formIsValid) void handleLogin();
                      else Keyboard.dismiss();
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    disabled={loading}
                    hitSlop={12}
                    onPress={() => setShowPassword((anterior) => !anterior)}
                    style={{ width: 40, height: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    {showPassword ? (
                      <EyeOff size={21} color={colors.navy[700]} />
                    ) : (
                      <Eye size={21} color="#64748B" />
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => void handleLogin()}
                disabled={!formIsValid}
                accessibilityRole="button"
                accessibilityLabel="Entrar no PRODSYNC"
                style={({ pressed }) => ({
                  marginTop: 20,
                  minHeight: 54,
                  borderRadius: 12,
                  backgroundColor: formIsValid ? colors.navy[700] : "#94A3B8",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 9,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
                  {loading ? "Autenticando..." : "Entrar"}
                </Text>
              </Pressable>
              {loading && (
                <Text style={{ textAlign: "center", color: "#64748B", fontSize: 12, marginTop: 10 }}>
                  Verificando suas credenciais...
                </Text>
              )}

              {!keyboardVisible && (
                <>
                  <View style={{ alignItems: "center", marginTop: 23, gap: 4 }}>
                    <Text style={{ color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
                      Autenticação integrada ao PRODSYNC ERP
                    </Text>
                    <Text style={{ color: colors.primary[600], fontSize: 12, fontWeight: "700" }}>
                      Suporte: TI — ramal 3321
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: colors.primary[50],
                    borderColor: colors.primary[100], borderWidth: 1,
                    borderRadius: 14, marginTop: 17, padding: 12,
                  }}>
                    <Text style={{ color: colors.primary[600], textAlign: "center", fontSize: 12 }}>
                      Acesso restrito aos usuários autorizados
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
