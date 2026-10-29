
import { useCallback, useMemo, useState } from "react";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  AlertCircle,
  QrCode,
  RefreshCw,
  Search,
  X,
} from "lucide-react-native";

import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
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

const nomesSituacoes: Record<SituacaoOP, string> = {
  PENDENTE: "Pendente",
  EM_PRODUCAO: "Em produção",
  PAUSADA: "Pausada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function corSituacao(situacao: SituacaoOP) {
  switch (situacao) {
    case "EM_PRODUCAO":
      return colors.success;

    case "FINALIZADA":
      return "#167046";

    case "CANCELADA":
      return "#B42318";

    case "PAUSADA":
      return "#B45309";

    default:
      return colors.warning;
  }
}

// ==========================================
// CARTÃO DE ORDEM DE PRODUÇÃO
// ==========================================

type OrderCardProps = {
  ordem: OrdemProducao;
  onPress: () => void;
};

function OrderCard({
  ordem,
  onPress,
}: OrderCardProps) {
  const percentual =
    ordem.quantidadePlanejada > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (ordem.quantidadeProduzida /
                ordem.quantidadePlanejada) *
                100
            )
          )
        )
      : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Consultar OP ${ordem.numero}`}
      style={({ pressed }) => ({
        backgroundColor: "white",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {/* NÚMERO E SITUAÇÃO */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Text
          style={{
            color: colors.navy[700],
            fontSize: 19,
            fontWeight: "800",
          }}
        >
          OP #{ordem.numero}
        </Text>

        <Text
          style={{
            color: corSituacao(ordem.situacao),
            fontWeight: "700",
            fontSize: 12,
          }}
        >
          {nomesSituacoes[ordem.situacao]}
        </Text>
      </View>

      {/* PRODUTO */}
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 16,
          fontWeight: "600",
          marginTop: 12,
        }}
      >
        {ordem.produto?.descricao ??
          "Produto não identificado"}
      </Text>

      <Text
        style={{
          color: colors.text.secondary,
          marginTop: 5,
          fontSize: 13,
        }}
      >
        Código: {ordem.produto?.codigo ?? "—"}
      </Text>

      {/* QUANTIDADES */}
      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 12,
            }}
          >
            Planejado
          </Text>

          <Text
            style={{
              color: colors.navy[700],
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {ordem.quantidadePlanejada.toLocaleString(
              "pt-BR"
            )}
          </Text>
        </View>

        <View>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 12,
            }}
          >
            Produzido
          </Text>

          <Text
            style={{
              color: colors.navy[700],
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {ordem.quantidadeProduzida.toLocaleString(
              "pt-BR"
            )}
          </Text>
        </View>

        <View>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 12,
            }}
          >
            Progresso
          </Text>

          <Text
            style={{
              color: colors.navy[700],
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {percentual}%
          </Text>
        </View>
      </View>

      {/* BARRA DE PROGRESSO */}
      <View
        style={{
          height: 7,
          borderRadius: 10,
          backgroundColor: "#E2E8F0",
          overflow: "hidden",
          marginTop: 12,
        }}
      >
        <View
          style={{
            width: `${percentual}%`,
            height: "100%",
            backgroundColor: colors.primary[500],
            borderRadius: 10,
          }}
        />
      </View>

      <Text
        style={{
          color: colors.text.muted,
          fontSize: 12,
          marginTop: 12,
        }}
      >
        Toque para consultar os detalhes da OP
      </Text>
    </Pressable>
  );
}

// ==========================================
// TELA DE ORDENS DE PRODUÇÃO
// ==========================================

export default function OrdensScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{ scan?: string }>();

  const [query, setQuery] = useState("");

  const [scannerOpen, setScannerOpen] = useState(
    params.scan === "1"
  );

  const [orders, setOrders] = useState<
    OrdemProducao[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] =
    useState(false);

  // ==========================================
  // CARREGAR OPS REAIS DA API
  // ==========================================

  const carregarOrdens = useCallback(
    async (atualizacao = false) => {
      if (atualizacao) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data =
          await ordensProducaoApi.listar();

        setOrders(data);
        setSessionExpired(false);
      } catch (err) {
        const mensagem =
          err instanceof Error
            ? err.message
            : "Erro ao consultar as ordens.";

        setError(mensagem);

        if (
          err instanceof ErroAPI &&
          err.status === 401
        ) {
          setSessionExpired(true);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Atualiza a lista ao entrar na aba.
  useFocusEffect(
    useCallback(() => {
      void carregarOrdens();
    }, [carregarOrdens])
  );

  // ==========================================
  // FILTRAR ORDENS
  // ==========================================

  const visibleOrders = useMemo(() => {
    const termo = query.trim().toLowerCase();

    if (!termo) {
      return orders;
    }

    return orders.filter((order) => {
      const texto = [
        order.numero,
        order.produto?.codigo,
        order.produto?.descricao,
        nomesSituacoes[order.situacao],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [orders, query]);

  // ==========================================
  // NAVEGAÇÃO PARA DETALHES
  // ==========================================

  function abrirOrdem(numero: string) {
    const valor = numero.trim();

    if (!/^[A-Za-z0-9-]{1,40}$/.test(valor)) {
      setError(
        "Número de OP inválido."
      );
      return;
    }

    router.push({
      pathname: "/ordem/[id]",
      params: { id: valor },
    });
  }

  function search() {
    const valor = query.trim();

    if (!valor) return;

    const ordemEncontrada = orders.find(
      (ordem) =>
        ordem.numero.toLowerCase() ===
        valor.toLowerCase()
    );

    if (ordemEncontrada) {
      abrirOrdem(ordemEncontrada.numero);
      return;
    }

    setError(
      "OP não encontrada na lista. Confira o número informado."
    );
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* CABEÇALHO */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 14,
          gap: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.navy[700],
                fontSize: 27,
                fontWeight: "800",
              }}
            >
              Ordens de produção
            </Text>

            <Text
              style={{
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              Consulte as OPs cadastradas no ERP
            </Text>
          </View>

          {/* QR CODE */}
          <Pressable
            onPress={() => setScannerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir leitor de QR Code"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: colors.navy[700],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCode size={25} color="white" />
          </Pressable>
        </View>
      </View>

      {/* PESQUISA */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "white",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#CBD5E1",
          alignItems: "center",
          paddingHorizontal: 14,
          marginHorizontal: 22,
          marginBottom: 14,
        }}
      >
        <Search
          size={20}
          color={colors.text.muted}
        />

        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setError("");
          }}
          onSubmitEditing={search}
          placeholder="Número da OP ou produto"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={{
            flex: 1,
            height: 54,
            paddingHorizontal: 10,
            fontSize: 16,
            color: colors.text.primary,
          }}
        />

        <Pressable
          onPress={() => void carregarOrdens(true)}
          accessibilityRole="button"
          accessibilityLabel="Atualizar lista de ordens"
          disabled={loading || refreshing}
          style={{ padding: 5 }}
        >
          {refreshing ? (
            <ActivityIndicator
              color={colors.primary[500]}
            />
          ) : (
            <RefreshCw
              size={21}
              color={colors.primary[500]}
            />
          )}
        </Pressable>
      </View>

      {/* ERROS */}
      {error !== "" && (
        <View
          style={{
            marginHorizontal: 22,
            marginBottom: 14,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#FEEDEC",
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
            }}
          >
            <AlertCircle
              size={19}
              color="#B42318"
            />

            <Text
              style={{
                color: "#B42318",
                flex: 1,
              }}
            >
              {error}
            </Text>
          </View>

          {sessionExpired && (
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              style={{
                paddingVertical: 9,
                borderRadius: 9,
                backgroundColor: colors.navy[700],
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                }}
              >
                Fazer login novamente
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* LISTAGEM */}
      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
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
            Carregando ordens do ERP...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingBottom: 32,
            gap: 14,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                void carregarOrdens(true)
              }
              tintColor={colors.primary[500]}
            />
          }
        >
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 13,
            }}
          >
            {visibleOrders.length} ordem(ns) encontrada(s)
          </Text>

          {visibleOrders.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 28,
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: colors.navy[700],
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Nenhuma OP encontrada
              </Text>

              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: "center",
                  lineHeight: 21,
                }}
              >
                Verifique a pesquisa ou atualize
                a lista de ordens.
              </Text>
            </View>
          ) : (
            visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                ordem={order}
                onPress={() =>
                  abrirOrdem(order.numero)
                }
              />
            ))
          )}
        </ScrollView>
      )}

      {/* MODAL DE QR CODE */}
      <Modal
        visible={scannerOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setScannerOpen(false)
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(3,12,24,0.92)",
            padding: 24,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() =>
              setScannerOpen(false)
            }
            accessibilityRole="button"
            accessibilityLabel="Fechar leitor de QR Code"
            style={{
              position: "absolute",
              top: 54,
              right: 24,
              padding: 4,
            }}
          >
            <X
              size={30}
              color="white"
            />
          </Pressable>

          <View
            style={{
              height: 250,
              borderWidth: 3,
              borderColor: colors.primary[500],
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCode
              size={105}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontSize: 20,
              fontWeight: "700",
              marginTop: 26,
            }}
          >
            Leitura de QR Code
          </Text>

          <Text
            style={{
              color: "#CBD5E1",
              textAlign: "center",
              marginTop: 10,
              lineHeight: 22,
            }}
          >
            A integração com a câmera será
            implementada na próxima etapa.
            Por enquanto, consulte as OPs
            utilizando a pesquisa.
          </Text>

          <Pressable
            onPress={() =>
              setScannerOpen(false)
            }
            accessibilityRole="button"
            style={{
              height: 54,
              borderRadius: 12,
              backgroundColor: colors.primary[500],
              alignItems: "center",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "800",
                fontSize: 16,
              }}
            >
              Voltar às ordens
            </Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
