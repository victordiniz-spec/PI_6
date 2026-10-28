
import { Boxes } from "lucide-react-native";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";

// API do PRODSYNC ERP
const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? ""
).replace(/\/+$/, "");

// Chaves utilizadas no armazenamento seguro
const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

// Estrutura da resposta enviada pelo NestJS
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

  // Campos do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Controle do carregamento
  const [loading, setLoading] = useState(false);

  // Evita múltiplas requisições simultâneas
  const submitting = useRef(false);

  // Validação inicial
  const emailIsValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const formIsValid =
    emailIsValid &&
    password.length > 0 &&
    !loading;

  // Login real pelo ERP
  async function handleLogin() {
    if (submitting.current) {
      return;
    }

    if (!emailIsValid || !password) {
      Alert.alert(
        "Dados inválidos",
        "Informe um e-mail válido e sua senha."
      );
      return;
    }

    if (!API_URL) {
      Alert.alert(
        "API não configurada",
        "Configure EXPO_PUBLIC_API_URL no arquivo .env do projeto."
      );
      return;
    }

    submitting.current = true;
    setLoading(true);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      // Solicita autenticação ao NestJS
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            senha: password,
          }),
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        Alert.alert(
          "Acesso negado",
          "E-mail ou senha incorretos, ou usuário desativado."
        );
        return;
      }

      if (!response.ok) {
        Alert.alert(
          "Erro no servidor",
          "Não foi possível realizar o login. Tente novamente."
        );
        return;
      }

      const data: LoginResponse =
        await response.json();

      // Verifica o formato da resposta
      if (
        !data.accessToken ||
        !data.usuario?.id ||
        !data.usuario?.perfil
      ) {
        throw new Error(
          "Resposta de autenticação inválida."
        );
      }

      // Salva a sessão de forma segura
      await SecureStore.setItemAsync(
        TOKEN_KEY,
        data.accessToken
      );

      await SecureStore.setItemAsync(
        USER_KEY,
        JSON.stringify(data.usuario)
      );

      // Remove a senha da tela
      setPassword("");

      // Abre a Home do PRODSYNC
      router.replace("/(tabs)");

    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        Alert.alert(
          "Tempo esgotado",
          "A API demorou para responder. Verifique a rede e tente novamente."
        );
      } else {
        Alert.alert(
          "Erro de conexão",
          "Não foi possível conectar ao PRODSYNC ERP. Verifique o endereço da API, o Wi-Fi e se o servidor NestJS está ligado."
        );

        console.error(
          "Falha na autenticação:",
          error instanceof Error
            ? error.message
            : "Erro desconhecido"
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
      style={{
        flex: 1,
        backgroundColor: colors.navy[700],
      }}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <View className="w-full max-w-[440px] flex-1 self-center bg-navy-700">

            {/* IDENTIDADE VISUAL */}
            <View className="min-h-[380px] flex-1 items-center justify-center px-6 py-12">

              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <Boxes
                  size={34}
                  color={colors.primary[100]}
                  strokeWidth={1.8}
                />
              </View>

              <Text className="mt-5 text-3xl font-extrabold tracking-tight text-white">
                PRODSYNC
              </Text>

              <Text className="mt-1 text-base font-medium text-primary-100">
                Controle de Produção
              </Text>

              <View className="mt-6 flex-row items-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5">
                <View className="mr-2 h-2 w-2 rounded-full bg-primary-500" />

                <Text className="text-sm font-semibold text-white">
                  JM FORROS
                </Text>
              </View>
            </View>

            {/* FORMULÁRIO */}
            <View className="rounded-t-[28px] bg-background px-6 pb-8 pt-7">

              <Text className="text-xl font-bold text-slate-950">
                Entrar na sua conta
              </Text>

              <Text className="mt-1 text-sm text-slate-500">
                Utilize as credenciais cadastradas no PRODSYNC ERP.
              </Text>

              <View className="mt-7 gap-5">

                {/* EMAIL */}
                <TextField
                  label="E-mail"
                  placeholder="Digite seu e-mail"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  error={
                    email.length > 0 &&
                    !emailIsValid
                      ? "Informe um e-mail válido."
                      : undefined
                  }
                />

                {/* SENHA */}
                <TextField
                  label="Senha"
                  placeholder="Digite sua senha"
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />

                {/* BOTÃO DE LOGIN */}
                <Button
                  title={
                    loading
                      ? "Autenticando..."
                      : "Entrar"
                  }
                  disabled={!formIsValid}
                  onPress={() => {
                    void handleLogin();
                  }}
                />

                {loading && (
                  <View className="flex-row items-center justify-center gap-2">
                    <ActivityIndicator
                      size="small"
                      color={colors.primary[600]}
                    />

                    <Text className="text-sm text-slate-500">
                      Verificando suas credenciais...
                    </Text>
                  </View>
                )}

              </View>

              {/* INFORMAÇÕES */}
              <View className="mt-7 items-center">

                <Text className="text-xs text-slate-400">
                  Autenticação integrada ao PRODSYNC ERP
                </Text>

                <Text className="mt-1 text-xs font-semibold text-primary-600">
                  Suporte: TI — ramal 3321
                </Text>

              </View>

              {/* AVISO DE SEGURANÇA */}
              <View className="mt-6 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3">

                <Text className="text-center text-xs text-primary-600">
                  Acesso restrito aos usuários autorizados
                </Text>

              </View>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
