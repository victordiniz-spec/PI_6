
import { useCallback, useState } from "react";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  ArrowLeft,
  CheckCircle2,
  CirclePause,
  Play,
  Printer,
  ScanLine,
  Square,
  RefreshCw,
  AlertCircle,
  LockKeyhole,
  QrCode,
} from "lucide-react-native";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

import {
  ErroAPI,
  ordensProducaoApi,
  type OrdemProducao,
  type SituacaoOP,
} from "@/services/ordensProducao";

// ==========================================
// SITUAÇÕES DAS ORDENS
// ==========================================

const situacoes: Record<SituacaoOP, string> = {
  PENDENTE: "Pendente",
  EM_PRODUCAO: "Em produção",
  PAUSADA: "Pausada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function nomeSituacao(situacao: SituacaoOP) {
  return situacoes[situacao] ?? situacao;
}

function corSituacao(situacao: SituacaoOP) {
  switch (situacao) {
    case "EM_PRODUCAO":
      return colors.success;
    case "PAUSADA":
      return colors.warning;
    case "FINALIZADA":
      return "#7CE0B0";
    case "CANCELADA":
      return "#FCA5A5";
    default:
      return "#FDE68A";
  }
}

function formatarQuantidade(valor: number) {
  return valor.toLocaleString("pt-BR");
}

// ==========================================
// COMPONENTES VISUAIS
// ==========================================

function TituloSecao({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "800",
        marginTop: 8,
      }}
    >
      {children}
    </Text>
  );
}

function AvisoSeguranca({
  mensagem,
}: {
  mensagem: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#EFF6FF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        padding: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <LockKeyhole size={19} color="#1D4ED8" />
      <Text
        style={{
          color: "#1E40AF",
          flex: 1,
          fontSize: 13,
          lineHeight: 19,
        }}
      >
        {mensagem}
      </Text>
    </View>
  );
}

function CartaoResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number | string;
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text
        style={{
          color: "#CBD5E1",
          fontSize: 12,
        }}
      >
        {titulo}
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 22,
          fontWeight: "800",
        }}
      >
        {typeof valor === "number"
          ? formatarQuantidade(valor)
          : valor}
      </Text>
    </View>
  );
}

// ==========================================
// TELA DE DETALHES DA OP
// ==========================================

export default function OrderDetailScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [ordem, setOrdem] =
    useState<OrdemProducao | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sessaoExpirada, setSessaoExpirada] =
    useState(false);

  // Campos preparados para o futuro
  // módulo de sucata.
  const [scrapKg, setScrapKg] = useState("");
  const [scrapReason, setScrapReason] =
    useState("");

  const [scrapObservation, setScrapObservation] =
    useState("");

  // ==========================================
  // CONSULTAR OP REAL NO NESTJS
  // ==========================================

  const carregarOrdem = useCallback(
    async (atualizacao = false) => {
      if (!id || typeof id !== "string") {
        setErro("Número da OP não informado.");
        setCarregando(false);
        return;
      }

      if (atualizacao) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");
      setSessaoExpirada(false);

      try {
        const dados =
          await ordensProducaoApi.buscar(id);

        setOrdem(dados);
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a OP.";

        setErro(mensagem);
        setOrdem(null);

        if (
          error instanceof ErroAPI &&
          error.status === 401
        ) {
          setSessaoExpirada(true);
        }
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [id]
  );

  // Recarrega sempre que a tela recebe foco.
  useFocusEffect(
    useCallback(() => {
      void carregarOrdem();
    }, [carregarOrdem])
  );

  // ==========================================
  // INFORMAÇÕES DA OP
  // ==========================================

  const quantidadePlanejada =
    ordem?.quantidadePlanejada ?? 0;

  const quantidadeProduzida =
    ordem?.quantidadeProduzida ?? 0;

  const quantidadePendente = Math.max(
    0,
    quantidadePlanejada - quantidadeProduzida
  );

  const percentual =
    quantidadePlanejada > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (quantidadeProduzida /
                quantidadePlanejada) *
                100
            )
          )
        )
      : 0;

  // ==========================================
  // AÇÕES AINDA NÃO INTEGRADAS
  // ==========================================

  function funcionalidadeBloqueada(
    funcionalidade: string
  ) {
    Alert.alert(
      "Funcionalidade em preparação",
      `${funcionalidade} será liberada após a implementação das operações seguras no backend e da autorização do tablet e da máquina. Nenhuma alteração foi realizada na OP.`
    );
  }

  const actions = [
    {
      title: "Iniciar produção",
      icon: Play,
      color: colors.success,
    },
    {
      title: "Registrar parada",
      icon: CirclePause,
      color: colors.warning,
    },
    {
      title: "Finalizar produção",
      icon: Square,
      color: colors.danger,
    },
  ];

  // ==========================================
  // INTERFACE PRINCIPAL
  // ==========================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 22,
          gap: 16,
          paddingBottom: 40,
        }}
      >
        {/* CABEÇALHO */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft
              size={23}
              color={colors.navy[700]}
            />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text.secondary,
              }}
            >
              Ordem de produção
            </Text>

            <Text
              style={{
                color: colors.navy[700],
                fontSize: 26,
                fontWeight: "800",
              }}
            >
              OP #{ordem?.numero ?? id}
            </Text>
          </View>

          <Pressable
            onPress={() => void carregarOrdem(true)}
            disabled={carregando || atualizando}
            accessibilityLabel="Atualizar detalhes da OP"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {atualizando ? (
              <ActivityIndicator
                color={colors.primary[500]}
              />
            ) : (
              <RefreshCw
                size={21}
                color={colors.navy[700]}
              />
            )}
          </Pressable>
        </View>

        {/* CARREGAMENTO */}
        {carregando ? (
          <View
            style={{
              paddingVertical: 80,
              alignItems: "center",
              gap: 14,
            }}
          >
            <ActivityIndicator
              size="large"
              color={colors.primary[500]}
            />

            <Text
              style={{
                color: colors.text.secondary,
              }}
            >
              Consultando ordem de produção...
            </Text>
          </View>
        ) : erro || !ordem ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 25,
              alignItems: "center",
              gap: 15,
            }}
          >
            <AlertCircle
              size={38}
              color={colors.danger}
            />

            <Text
              style={{
                color: colors.danger,
                textAlign: "center",
                fontSize: 15,
              }}
            >
              {erro || "Ordem não encontrada."}
            </Text>

            <Pressable
              onPress={() => {
                if (sessaoExpirada) {
                  router.replace("/");
                } else {
                  void carregarOrdem();
                }
              }}
              style={{
                backgroundColor: colors.navy[700],
                paddingHorizontal: 20,
                paddingVertical: 13,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                }}
              >
                {sessaoExpirada
                  ? "Fazer login novamente"
                  : "Tentar novamente"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* INFORMAÇÕES REAIS DA OP */}
            <View
              style={{
                backgroundColor: colors.navy[700],
                borderRadius: 20,
                padding: 20,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 19,
                    fontWeight: "700",
                    flex: 1,
                  }}
                >
                  {ordem.produto?.descricao ??
                    "Produto não identificado"}
                </Text>

                <Text
                  style={{
                    color: corSituacao(
                      ordem.situacao
                    ),
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  {nomeSituacao(
                    ordem.situacao
                  )}
                </Text>
              </View>

              <Text
                style={{
                  color: "#CBD5E1",
                }}
              >
                Código: {ordem.produto?.codigo ?? "—"}
              </Text>

              {!!ordem.produto?.cor && (
                <Text
                  style={{
                    color: "#CBD5E1",
                  }}
                >
                  Cor: {ordem.produto.cor}
                </Text>
              )}

              {!!ordem.produto?.acabamento && (
                <Text
                  style={{
                    color: "#CBD5E1",
                  }}
                >
                  Acabamento: {ordem.produto.acabamento}
                </Text>
              )}

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                  gap: 10,
                }}
              >
                <CartaoResumo
                  titulo="Planejada"
                  valor={quantidadePlanejada}
                />

                <CartaoResumo
                  titulo="Produzida"
                  valor={quantidadeProduzida}
                />

                <CartaoResumo
                  titulo="Pendente"
                  valor={quantidadePendente}
                />
              </View>

              <View
                style={{
                  marginTop: 8,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: "#CBD5E1",
                    }}
                  >
                    Progresso da produção
                  </Text>

                  <Text
                    style={{
                      color: "white",
                      fontWeight: "800",
                    }}
                  >
                    {percentual}%
                  </Text>
                </View>

                <View
                  style={{
                    height: 9,
                    backgroundColor: "#31536B",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${percentual}%`,
                      backgroundColor:
                        colors.primary[500],
                    }}
                  />
                </View>
              </View>

              {!!ordem.observacoes && (
                <View
                  style={{
                    marginTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: "#31536B",
                    paddingTop: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#CBD5E1",
                      fontSize: 12,
                    }}
                  >
                    Observações
                  </Text>

                  <Text
                    style={{
                      color: "white",
                      marginTop: 5,
                    }}
                  >
                    {ordem.observacoes}
                  </Text>
                </View>
              )}
            </View>

            {/* AÇÕES DA PRODUÇÃO */}
            <TituloSecao>
              Ações da produção
            </TituloSecao>

            <AvisoSeguranca
              mensagem="As ações estão temporariamente bloqueadas. Antes de iniciar ou finalizar uma OP, será necessário autenticar o tablet e vinculá-lo à máquina autorizada."
            />

            {actions.map(
              ({ title, icon: Icon, color }) => (
                <Pressable
                  key={title}
                  accessibilityRole="button"
                  onPress={() =>
                    funcionalidadeBloqueada(title)
                  }
                  style={{
                    backgroundColor: "white",
                    borderRadius: 15,
                    padding: 17,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: `${color}18`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      size={24}
                      color={color}
                    />
                  </View>

                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 16,
                      fontWeight: "700",
                      flex: 1,
                    }}
                  >
                    {title}
                  </Text>

                  <LockKeyhole
                    size={18}
                    color={colors.text.muted}
                  />
                </Pressable>
              )
            )}

            {/* ETIQUETAS */}
            <TituloSecao>
              Etiquetas
            </TituloSecao>

            <AvisoSeguranca
              mensagem="A API ainda não possui o cadastro e o histórico real das etiquetas desta OP. Os valores demonstrativos foram removidos para evitar informações incorretas."
            />

            <View
              style={{
                flexDirection: "row",
                gap: 10,
              }}
            >
              {[
                {
                  titulo: "Concluídas",
                  icon: CheckCircle2,
                  cor: colors.success,
                },
                {
                  titulo: "Não bipadas",
                  icon: ScanLine,
                  cor: colors.warning,
                },
                {
                  titulo: "Não impressas",
                  icon: Printer,
                  cor: colors.danger,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <View
                    key={item.titulo}
                    style={{
                      flex: 1,
                      minHeight: 112,
                      backgroundColor: "white",
                      borderRadius: 15,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <Icon
                      size={22}
                      color={item.cor}
                    />

                    <Text
                      style={{
                        color: colors.text.primary,
                        fontSize: 24,
                        fontWeight: "800",
                        marginTop: 10,
                      }}
                    >
                      —
                    </Text>

                    <Text
                      style={{
                        color: colors.text.secondary,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {item.titulo}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
              }}
            >
              <Pressable
                onPress={() =>
                  funcionalidadeBloqueada(
                    "Emissão de etiquetas"
                  )
                }
                style={{
                  flex: 1,
                  minHeight: 110,
                  backgroundColor:
                    colors.primary[500],
                  borderRadius: 16,
                  padding: 16,
                  justifyContent: "space-between",
                }}
              >
                <Printer
                  size={28}
                  color="white"
                />

                <View>
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    Emitir etiqueta
                  </Text>

                  <Text
                    style={{
                      color: "#E0F2FE",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    Aguardando integração
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() =>
                  funcionalidadeBloqueada(
                    "Leitura de etiquetas"
                  )
                }
                style={{
                  flex: 1,
                  minHeight: 110,
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 16,
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <ScanLine
                  size={28}
                  color={colors.navy[700]}
                />

                <View>
                  <Text
                    style={{
                      color: colors.navy[700],
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    Ler etiqueta
                  </Text>

                  <Text
                    style={{
                      color: colors.text.muted,
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    Aguardando integração
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* LANÇAMENTO DE SUCATA */}
            <TituloSecao>
              Lançamento de sucata
            </TituloSecao>

            <AvisoSeguranca
              mensagem="O lançamento de sucata será integrado ao PostgreSQL em uma etapa posterior. Os campos estão preservados, mas o registro ainda não está habilitado."
            />

            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 18,
                padding: 17,
                gap: 12,
                borderWidth: 1,
                borderColor: "#CBD5E1",
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: "700",
                    marginBottom: 7,
                  }}
                >
                  Peso da sucata (kg)
                </Text>

                <TextInput
                  value={scrapKg}
                  onChangeText={setScrapKg}
                  editable={false}
                  keyboardType="decimal-pad"
                  placeholder="Ex.: 2,50"
                  placeholderTextColor={
                    colors.text.muted
                  }
                  style={{
                    height: 52,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#B8C3D1",
                    backgroundColor: "#F1F5F9",
                    paddingHorizontal: 14,
                    fontSize: 16,
                    color: colors.text.primary,
                  }}
                />
              </View>

              <View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: "700",
                    marginBottom: 7,
                  }}
                >
                  Motivo
                </Text>

                <TextInput
                  value={scrapReason}
                  onChangeText={setScrapReason}
                  editable={false}
                  placeholder="Informe o motivo da sucata"
                  placeholderTextColor={
                    colors.text.muted
                  }
                  multiline
                  style={{
                    minHeight: 82,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#B8C3D1",
                    backgroundColor: "#F1F5F9",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.text.primary,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: "700",
                    marginBottom: 7,
                  }}
                >
                  Observação
                </Text>

                <TextInput
                  value={scrapObservation}
                  onChangeText={setScrapObservation}
                  editable={false}
                  placeholder="Observação opcional"
                  placeholderTextColor={
                    colors.text.muted
                  }
                  multiline
                  style={{
                    minHeight: 74,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#B8C3D1",
                    backgroundColor: "#F1F5F9",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.text.primary,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <Pressable
                onPress={() =>
                  funcionalidadeBloqueada(
                    "Lançamento de sucata"
                  )
                }
                style={{
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: "#94A3B8",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 9,
                }}
              >
                <LockKeyhole
                  size={18}
                  color="white"
                />

                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  Lançamento indisponível
                </Text>
              </Pressable>
            </View>

            {/* IDENTIFICAÇÃO */}
            <View
              style={{
                alignItems: "center",
                paddingTop: 10,
                gap: 6,
              }}
            >
              <QrCode
                size={22}
                color={colors.text.muted}
              />

              <Text
                style={{
                  color: colors.text.muted,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                PRODSYNC • OP {ordem.numero}
              </Text>

              <Text
                style={{
                  color: colors.text.muted,
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                Informações consultadas no Mini ERP
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
