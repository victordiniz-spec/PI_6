
import { Boxes } from "lucide-react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";

// Credenciais temporárias para desenvolvimento
const TEST_USER = "operador";
const TEST_PASSWORD = "Teste@123";

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const passwordIsValid = password.length >= 8;

  const formIsValid =
    username.trim().length > 0 && passwordIsValid;

  function handleLogin() {
    const validUser =
      username.trim() === TEST_USER;

    const validPassword =
      password === TEST_PASSWORD;

    if (!validUser || !validPassword) {
      Alert.alert(
        "Erro no login",
        "Usuário ou senha incorretos."
      );
      return;
    }

    // Abre a Home e retira o login do histórico
    router.replace("/(tabs)");
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="w-full max-w-[440px] flex-1 self-center bg-navy-700">

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

            <View className="rounded-t-[28px] bg-background px-6 pb-8 pt-7">

              <Text className="text-xl font-bold text-slate-950">
                Entrar na sua conta
              </Text>

              <Text className="mt-1 text-sm text-slate-500">
                Use suas credenciais para acessar a produção.
              </Text>

              <View className="mt-7 gap-5">

                <TextField
                  label="Usuário"
                  placeholder="Digite seu usuário"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />

                <TextField
                  label="Senha"
                  placeholder="Digite sua senha"
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  error={
                    password.length > 0 && !passwordIsValid
                      ? "A senha deve possuir pelo menos 8 caracteres."
                      : undefined
                  }
                />

                <Button
                  title="Entrar"
                  disabled={!formIsValid}
                  onPress={handleLogin}
                />
              </View>

              <View className="mt-7 items-center">
                <Text className="text-xs text-slate-400">
                  Ambiente de desenvolvimento
                </Text>

                <Text className="mt-1 text-xs font-semibold text-primary-600">
                  Suporte: TI — ramal 3321
                </Text>
              </View>

              <View className="mt-6 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3">
                <Text className="text-center text-xs text-primary-600">
                  Acesso restrito aos operadores autorizados
                </Text>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
