import {
  ArrowRight,
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react-native";
import { useEffect, useRef, useState, type ComponentRef } from "react";
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

// Endereco da API deve incluir /api; no celular utilize o IP do computador.
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

const COR_BOTAO = "#17395C";
const COR_BOTAO_DESABILITADO = "#5C7894";
const COR_TEXTO = "#172F42";
const COR_SECUNDARIA = "#64748B";
const COR_BORDA = "#CBD5E1";
const COR_ERRO = "#DC2626";

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
  const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);

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
      // Mantem o fluxo atual de autorizacao do tablet.
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
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.navy[700] }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexGrow: 1,
              width: "100%",
              maxWidth: 440,
              alignSelf: "center",
              backgroundColor: colors.navy[700],
            }}
          >
            {/* Cabecalho: compacto quando o teclado estiver visivel. */}
            <View
              style={{
                minHeight: keyboardVisible ? 82 : 210,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 24,
                paddingTop: keyboardVisible ? 8 : 24,
                paddingBottom: keyboardVisible ? 12 : 28,
              }}
            >
              <View
                style={{
                  width: keyboardVisible ? 42 : 64,
                  height: keyboardVisible ? 42 : 64,
                  borderRadius: 17,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Boxes
                  size={keyboardVisible ? 24 : 35}
                  color="#FFFFFF"
                  strokeWidth={1.8}
                />
              </View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: keyboardVisible ? 22 : 31,
                  fontWeight: "800",
                  marginTop: 10,
                  letterSpacing: 0.5,
                }}
              >
                PRODSYNC
              </Text>
              {!keyboardVisible && (
                <>
                  <Text style={{ color: colors.primary[100], fontSize: 15, marginTop: 5 }}>
                    Controle de Produção
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 99,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.2)",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      marginTop: 16,
                      paddingHorizontal: 18,
                      paddingVertical: 9,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        marginRight: 9,
                        backgroundColor: colors.primary[500],
                      }}
                    />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                      JM FORROS
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Formulario */}
            <View
              style={{
                flexGrow: 1,
                backgroundColor: colors.background,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 24,
                paddingTop: keyboardVisible ? 18 : 28,
                paddingBottom: keyboardVisible ? 24 : 32,
              }}
            >
              <Text style={{ color: "#0F172A", fontSize: 23, fontWeight: "800" }}>
                Entrar na sua conta
              </Text>
              <Text
                style={{
                  color: COR_SECUNDARIA,
                  fontSize: 13,
                  marginTop: 7,
                  lineHeight: 20,
                }}
              >
                Utilize as credenciais cadastradas no PRODSYNC ERP.
              </Text>

              {/* E-mail */}
              <View style={{ marginTop: 24 }}>
                <Text
                  style={{ color: COR_TEXTO, fontSize: 14, fontWeight: "700", marginBottom: 9 }}
                >
                  E-mail
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 56,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: email.length > 0 && !emailIsValid ? COR_ERRO : COR_BORDA,
                    borderRadius: 14,
                    paddingHorizontal: 15,
                  }}
                >
                  <Mail size={20} color={COR_SECUNDARIA} />
                  <TextInput
                    style={{ flex: 1, color: COR_TEXTO, fontSize: 16, minHeight: 54, marginLeft: 12 }}
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
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
                {email.length > 0 && !emailIsValid && (
                  <Text style={{ color: COR_ERRO, fontSize: 12, marginTop: 6 }}>
                    Informe um e-mail válido.
                  </Text>
                )}
              </View>

              {/* Senha */}
              <View style={{ marginTop: 19 }}>
                <Text
                  style={{ color: COR_TEXTO, fontSize: 14, fontWeight: "700", marginBottom: 9 }}
                >
                  Senha
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 56,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: COR_BORDA,
                    borderRadius: 14,
                    paddingHorizontal: 15,
                  }}
                >
                  <LockKeyhole size={20} color={COR_SECUNDARIA} />
                  <TextInput
                    ref={passwordInputRef}
                    style={{ flex: 1, color: COR_TEXTO, fontSize: 16, minHeight: 54, marginLeft: 12 }}
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
                    style={{ width: 42, height: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    {showPassword ? (
                      <EyeOff size={21} color={COR_BOTAO} />
                    ) : (
                      <Eye size={21} color={COR_SECUNDARIA} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Botao Entrar: o layout fica em uma View interna com estilos fixos.
                  Isso evita problemas de alinhamento do Pressable no Android. */}
              <View
                style={{
                  width: "100%",
                  marginTop: 26,
                  backgroundColor: formIsValid ? COR_BOTAO : COR_BOTAO_DESABILITADO,
                  borderRadius: 14,
                  overflow: "hidden",
                  elevation: formIsValid ? 3 : 0,
                }}
              >
                <Pressable
                  onPress={() => void handleLogin()}
                  disabled={!formIsValid}
                  accessibilityRole="button"
                  accessibilityLabel="Entrar no PRODSYNC"
                  accessibilityState={{ disabled: !formIsValid, busy: loading }}
                  style={{ width: "100%" }}
                >
                  <View
                    style={{
                      width: "100%",
                      minHeight: 60,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                    }}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 16,
                            fontWeight: "700",
                            marginLeft: 10,
                            textAlign: "center",
                          }}
                        >
                          Autenticando...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 17,
                            fontWeight: "800",
                            letterSpacing: 0.3,
                            textAlign: "center",
                          }}
                        >
                          Entrar
                        </Text>
                        <ArrowRight
                          size={21}
                          color="#FFFFFF"
                          strokeWidth={2.4}
                          style={{ marginLeft: 10 }}
                        />
                      </>
                    )}
                  </View>
                </Pressable>
              </View>

              {loading && (
                <Text style={{ textAlign: "center", color: COR_SECUNDARIA, fontSize: 12, marginTop: 11 }}>
                  Verificando suas credenciais...
                </Text>
              )}

              {!keyboardVisible && (
                <>
                  <View style={{ alignItems: "center", marginTop: 28, gap: 5 }}>
                    <Text style={{ color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
                      Autenticação integrada ao PRODSYNC ERP
                    </Text>
                    <Text style={{ color: colors.primary[600], fontSize: 12, fontWeight: "700" }}>
                      Suporte: TI — ramal 3321
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.primary[50],
                      borderColor: colors.primary[100],
                      borderWidth: 1,
                      borderRadius: 14,
                      marginTop: 20,
                      padding: 14,
                    }}
                  >
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
