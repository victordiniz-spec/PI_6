
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  Boxes,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Smartphone,
} from "lucide-react-native";

import { colors } from "@/theme/colors";

// ==========================================
// API PRODSYNC
// ==========================================

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? ""
).replace(/\/+$/, "");

// ==========================================
// ARMAZENAMENTO SEGURO
// ==========================================

const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

const DEVICE_TOKEN_KEY =
  "prodsync_device_credential";

// ==========================================
// TIPOS
// ==========================================

type SituacaoTablet =
  | "PENDENTE"
  | "AUTORIZADO"
  | "BLOQUEADO";

type Maquina = {
  id: string;
  codigo: string;
  nome: string;
  situacao: "ATIVA" | "MANUTENCAO" | "INATIVA";
};

type EstadoTablet = {
  id: string;
  identificador: string;
  nome: string | null;
  situacao: SituacaoTablet;
  liberado: boolean;
  mensagem: string;
  maquina: Maquina | null;
};

type SolicitarResponse = {
  id: string;
  identificador: string;
  situacao: "PENDENTE";
  credencial: string;
  mensagem: string;
};

type EstadoTela =
  | "carregando"
  | "sem_cadastro"
  | "pendente"
  | "autorizado"
  | "bloqueado"
  | "indisponivel"
  | "erro";

// ==========================================
// CORES
// ==========================================

const cor = {
  navy: "#123450",
  teal: "#007F80",
  fundo: "#F3F6F8",
  texto: "#172F42",
  secundario: "#64748B",
  borda: "#DCE5EB",
  branco: "#FFFFFF",
  verde: "#167046",
  amarelo: "#A66B11",
  vermelho: "#B42333",
};

// ==========================================
// COMPONENTE
// ==========================================

export default function AutorizacaoScreen() {
  const router = useRouter();

  const [estadoTela, setEstadoTela] =
    useState<EstadoTela>("carregando");

  const [dispositivo, setDispositivo] =
    useState<EstadoTablet | null>(null);

  const [identificador, setIdentificador] =
    useState<string | null>(null);

  const [mensagemErro, setMensagemErro] =
    useState("");

  const [ocupado, setOcupado] =
    useState(false);

  const operacaoAtual = useRef(false);

  // ==========================================
  // REQUISIÇÃO AUTENTICADA
  // ==========================================

  const requisicao = useCallback(
    async <T,>(
      rota: string,
      metodo: "GET" | "POST",
      credencial?: string,
    ): Promise<T> => {
      if (!API_URL) {
        throw new Error(
          "O endereço da API não está configurado."
        );
      }

      const token =
        await SecureStore.getItemAsync(
          TOKEN_KEY
        );

      if (!token) {
        throw new Error(
          "Sessão não encontrada. Faça login novamente."
        );
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      if (credencial) {
        headers["x-prodsync-device-token"] =
          credencial;
      }

      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        15000
      );

      try {
        const response = await fetch(
          `${API_URL}${rota}`,
          {
            method: metodo,
            headers,
            signal: controller.signal,
          }
        );

        const dados: unknown =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Sessão ou credencial inválida. Faça login novamente ou procure o administrador."
            );
          }

          if (response.status === 403) {
            throw new Error(
              "Seu usuário não tem permissão para esta operação."
            );
          }

          throw new Error(
            `A API retornou o erro ${response.status}.`
          );
        }

        return dados as T;
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          throw new Error(
            "Tempo esgotado. Confira a conexão de rede."
          );
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
    []
  );

  // ==========================================
  // INTERPRETAR A SITUAÇÃO
  // ==========================================

  const interpretarEstado = useCallback(
    (dados: EstadoTablet) => {
      setDispositivo(dados);
      setIdentificador(dados.identificador);
      setMensagemErro("");

      if (dados.situacao === "BLOQUEADO") {
        setEstadoTela("bloqueado");
        return;
      }

      if (
        dados.situacao === "AUTORIZADO" &&
        dados.liberado
      ) {
        setEstadoTela("autorizado");
        return;
      }

      if (
        dados.situacao === "AUTORIZADO" &&
        !dados.liberado
      ) {
        setEstadoTela("indisponivel");
        return;
      }

      setEstadoTela("pendente");
    },
    []
  );

  // ==========================================
  // VERIFICAR CADASTRO EXISTENTE
  // ==========================================

  const verificarAutorizacao =
    useCallback(async () => {
      if (operacaoAtual.current) {
        return;
      }

      operacaoAtual.current = true;
      setOcupado(true);
      setEstadoTela("carregando");
      setMensagemErro("");

      try {
        const credencial =
          await SecureStore.getItemAsync(
            DEVICE_TOKEN_KEY
          );

        if (!credencial) {
          setDispositivo(null);
          setIdentificador(null);
          setEstadoTela("sem_cadastro");
          return;
        }

        const dados =
          await requisicao<EstadoTablet>(
            "/tablets/estado",
            "GET",
            credencial
          );

        if (
          !dados ||
          typeof dados.liberado !== "boolean" ||
          !dados.situacao
        ) {
          throw new Error(
            "O servidor retornou uma resposta inválida."
          );
        }

        interpretarEstado(dados);
      } catch (error) {
        setEstadoTela("erro");

        setMensagemErro(
          error instanceof Error
            ? error.message
            : "Falha ao verificar autorização."
        );
      } finally {
        operacaoAtual.current = false;
        setOcupado(false);
      }
    }, [interpretarEstado, requisicao]);

  // ==========================================
  // SOLICITAR CADASTRO
  // ==========================================

  async function solicitarAcesso() {
    if (operacaoAtual.current) {
      return;
    }

    operacaoAtual.current = true;
    setOcupado(true);
    setMensagemErro("");

    try {
      // Nunca solicita um novo cadastro quando
      // já existe uma credencial instalada.
      const existente =
        await SecureStore.getItemAsync(
          DEVICE_TOKEN_KEY
        );

      if (existente) {
        setEstadoTela("erro");
        setMensagemErro(
          "Este dispositivo já possui um cadastro. Utilize Verificar autorização."
        );
        return;
      }

      const dados =
        await requisicao<SolicitarResponse>(
          "/tablets/solicitar",
          "POST"
        );

      if (
        !dados?.credencial ||
        !/^[a-f0-9]{64}$/.test(
          dados.credencial
        ) ||
        !dados.identificador
      ) {
        throw new Error(
          "O servidor retornou uma credencial inválida."
        );
      }

      // Salva somente a credencial desta
      // instalação, sem expô-la na interface.
      await SecureStore.setItemAsync(
        DEVICE_TOKEN_KEY,
        dados.credencial
      );

      setIdentificador(dados.identificador);
      setDispositivo(null);
      setEstadoTela("pendente");
    } catch (error) {
      setEstadoTela("erro");

      setMensagemErro(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar acesso."
      );
    } finally {
      operacaoAtual.current = false;
      setOcupado(false);
    }
  }

  // ==========================================
  // VERIFICAÇÃO INICIAL
  // ==========================================

  useEffect(() => {
    void verificarAutorizacao();
  }, [verificarAutorizacao]);

  // ==========================================
  // SAIR DA CONTA
  // ==========================================

  async function sair() {
    if (ocupado) {
      return;
    }

    try {
      await Promise.all([
        SecureStore.deleteItemAsync(
          TOKEN_KEY
        ),
        SecureStore.deleteItemAsync(
          USER_KEY
        ),
      ]);

      // Não apaga a credencial do dispositivo.
      // Assim, bloquear e relogar não cria
      // uma nova autorização automaticamente.
      router.replace("/");
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível encerrar a sessão."
      );
    }
  }

  // ==========================================
  // ENTRAR NA PRODUÇÃO
  // ==========================================

  function entrarNaProducao() {
    if (
      estadoTela !== "autorizado" ||
      !dispositivo?.liberado ||
      dispositivo.maquina?.situacao !== "ATIVA"
    ) {
      return;
    }

    router.replace("/(tabs)");
  }

  // ==========================================
  // APRESENTAÇÃO DA TELA
  // ==========================================

  const carregando =
    estadoTela === "carregando";

  const autorizado =
    estadoTela === "autorizado";

  const bloqueado =
    estadoTela === "bloqueado";

  const pendente =
    estadoTela === "pendente";

  const indisponivel =
    estadoTela === "indisponivel";

  const semCadastro =
    estadoTela === "sem_cadastro";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: cor.navy,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* CABEÇALHO */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 35,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 65,
              height: 65,
              borderRadius: 18,
              backgroundColor:
                "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 15,
            }}
          >
            <Boxes
              size={35}
              color={colors.primary[100]}
            />
          </View>

          <Text
            style={{
              color: cor.branco,
              fontSize: 29,
              fontWeight: "800",
            }}
          >
            PRODSYNC
          </Text>

          <Text
            style={{
              color: "#C8E6E7",
              marginTop: 4,
              fontSize: 14,
            }}
          >
            Controle de Produção
          </Text>

          <View
            style={{
              marginTop: 16,
              borderRadius: 30,
              paddingVertical: 8,
              paddingHorizontal: 17,
              backgroundColor:
                "rgba(255,255,255,0.12)",
            }}
          >
            <Text
              style={{
                color: cor.branco,
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              JM FORROS
            </Text>
          </View>
        </View>

        {/* CARTÃO PRINCIPAL */}
        <View
          style={{
            backgroundColor: cor.fundo,
            flexGrow: 1,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 22,
            paddingTop: 32,
            paddingBottom: 36,
          }}
        >
          <View
            style={{
              backgroundColor: cor.branco,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: cor.borda,
              padding: 23,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: autorizado
                  ? "#E6F5EC"
                  : bloqueado
                    ? "#FDEAEA"
                    : "#FFF4DC",
                marginBottom: 18,
              }}
            >
              {carregando ? (
                <ActivityIndicator
                  size="large"
                  color={cor.teal}
                />
              ) : autorizado ? (
                <CheckCircle2
                  size={37}
                  color={cor.verde}
                />
              ) : bloqueado ? (
                <LockKeyhole
                  size={36}
                  color={cor.vermelho}
                />
              ) : pendente ? (
                <Clock3
                  size={36}
                  color={cor.amarelo}
                />
              ) : (
                <ShieldAlert
                  size={36}
                  color={cor.amarelo}
                />
              )}
            </View>

            <Text
              style={{
                color: cor.texto,
                fontSize: 21,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {carregando
                ? "Verificando dispositivo..."
                : autorizado
                  ? "Dispositivo autorizado"
                  : bloqueado
                    ? "Acesso bloqueado"
                    : pendente
                      ? "Aguardando autorização"
                      : indisponivel
                        ? "Máquina indisponível"
                        : semCadastro
                          ? "Dispositivo não cadastrado"
                          : "Não foi possível verificar"}
            </Text>

            <Text
              style={{
                color: cor.secundario,
                fontSize: 14,
                lineHeight: 21,
                textAlign: "center",
                marginTop: 11,
                marginBottom: 21,
              }}
            >
              {carregando
                ? "Consultando o servidor do PRODSYNC."
                : autorizado
                  ? "Seu dispositivo foi aprovado pelo administrador."
                  : bloqueado
                    ? "O administrador bloqueou este dispositivo. Entre em contato com o responsável."
                    : pendente
                      ? "Este celular está aguardando liberação pelo administrador no Mini ERP."
                      : indisponivel
                        ? "O dispositivo está autorizado, mas a máquina vinculada não está ativa."
                        : semCadastro
                          ? "Solicite o cadastro deste celular para que o administrador possa vinculá-lo a uma máquina."
                          : mensagemErro}
            </Text>

            {/* IDENTIFICAÇÃO */}
            {identificador && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: "#F3F6F8",
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 17,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: cor.secundario,
                    fontWeight: "700",
                    marginBottom: 7,
                  }}
                >
                  IDENTIFICAÇÃO DO DISPOSITIVO
                </Text>

                <Text
                  selectable
                  style={{
                    color: cor.texto,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {identificador}
                </Text>
              </View>
            )}

            {/* MÁQUINA */}
            {dispositivo?.maquina && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: "#F3F6F8",
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 17,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: cor.secundario,
                    fontWeight: "700",
                    marginBottom: 7,
                  }}
                >
                  MÁQUINA VINCULADA
                </Text>

                <Text
                  style={{
                    color: cor.texto,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  {dispositivo.maquina.codigo}
                </Text>

                <Text
                  style={{
                    color: cor.secundario,
                    fontSize: 13,
                    marginTop: 3,
                  }}
                >
                  {dispositivo.maquina.nome}
                </Text>
              </View>
            )}

            {/* SOLICITAR */}
            {semCadastro && !ocupado && (
              <Pressable
                onPress={() => {
                  void solicitarAcesso();
                }}
                style={{
                  width: "100%",
                  backgroundColor: cor.navy,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 9,
                }}
              >
                <Smartphone
                  size={19}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Solicitar autorização
                </Text>
              </Pressable>
            )}

            {/* VERIFICAR */}
            {(pendente ||
              bloqueado ||
              indisponivel ||
              estadoTela === "erro") && (
              <Pressable
                onPress={() => {
                  void verificarAutorizacao();
                }}
                disabled={ocupado}
                style={{
                  width: "100%",
                  backgroundColor: cor.navy,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 9,
                  opacity: ocupado ? 0.6 : 1,
                }}
              >
                <RefreshCw
                  size={18}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Verificar autorização
                </Text>
              </Pressable>
            )}

            {/* ACESSAR */}
            {autorizado && (
              <Pressable
                onPress={entrarNaProducao}
                style={{
                  width: "100%",
                  backgroundColor: cor.verde,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 9,
                }}
              >
                <CheckCircle2
                  size={19}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Acessar produção
                </Text>
              </Pressable>
            )}
          </View>

          {/* RODAPÉ */}
          <View
            style={{
              marginTop: 24,
              alignItems: "center",
              gap: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LockKeyhole
                size={15}
                color={cor.secundario}
              />

              <Text
                style={{
                  color: cor.secundario,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Acesso controlado pelo PRODSYNC ERP
              </Text>
            </View>

            <Pressable
              onPress={() => void sair()}
              disabled={ocupado}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                gap: 8,
              }}
            >
              <LogOut
                size={17}
                color={cor.navy}
              />

              <Text
                style={{
                  color: cor.navy,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Sair da conta
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
