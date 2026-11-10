
import { useCallback, useMemo, useState } from "react";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
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
import { useAppTheme, type AppPalette } from "@/theme/colors";

import {
  ErroAPI,
  ordensProducaoApi,
  type OrdemProducao,
  type SituacaoOP,
} from "@/services/ordensProducao";

function getColors(p: AppPalette) {
  return {
    background: p.background,
    navy: { 700: p.navy },
    primary: { 500: p.accent },
    text: { primary: p.text, secondary: p.secondary, muted: p.muted },
    success: p.success, warning: p.accent,
  };
}

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

function corSituacao(situacao: SituacaoOP, p: AppPalette) {
  switch (situacao) {
    case "EM_PRODUCAO":
      return p.success;

    case "FINALIZADA":
      return p.success;

    case "CANCELADA":
      return p.danger;

    case "PAUSADA":
      return p.accent;

    default:
      return p.accent;
  }
}

// ==========================================
// CARTÃO DE ORDEM DE PRODUÇÃO
// ==========================================

type OrderCardProps = {
  ordem: OrdemProducao;
  onPress: () => void;
};

function OrderCard({ ordem, onPress }: OrderCardProps) {
  const { palette } = useAppTheme();
  const colors = getColors(palette);
  const planejado = Number(ordem.quantidadePlanejada) || 0;
  const produzido = Number(ordem.quantidadeProduzida) || 0;
  const percentual = planejado > 0
    ? Math.min(100, Math.max(0, Math.round((produzido / planejado) * 100)))
    : 0;

  const situacaoCor = corSituacao(ordem.situacao, palette);
  const formato = (valor: number) => valor.toLocaleString("pt-BR");

  return (
    // O fundo e a borda ficam em uma View externa para evitar estilos
    // inconsistentes em Pressable com NativeWind/React Native.
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes da OP ${ordem.numero}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {/* Faixa superior: numero da ordem e situacao */}
        <View
          style={{
            backgroundColor: palette.surfaceAlt,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1, gap: 8 }}>
            <ClipboardList size={21} color="#17395C" />
            <Text style={{ color: palette.navy, fontSize: 18, fontWeight: "800" }}>
              OP #{ordem.numero}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: ordem.situacao === "EM_PRODUCAO" ? "#E0F5E9" : "#F0F3F7",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 6,
              flexShrink: 1,
            }}
          >
            <Text style={{ color: situacaoCor, fontWeight: "700", fontSize: 11 }}>
              {nomesSituacoes[ordem.situacao] ?? ordem.situacao}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: palette.border }} />

        <View style={{ padding: 16 }}>
          {/* Produto */}
          <Text
            style={{
              color: palette.text,
              fontSize: 15,
              fontWeight: "700",
              lineHeight: 22,
            }}
          >
            {ordem.produto?.descricao ?? "Produto não identificado"}
          </Text>
          <Text style={{ color: palette.secondary, fontSize: 12, marginTop: 6 }}>
            Código do produto: {ordem.produto?.codigo ?? "—"}
          </Text>

          {/* Quantidades em dois blocos bem delimitados */}
          <View style={{ flexDirection: "row", marginTop: 17, gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: palette.surfaceAlt,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text style={{ color: palette.secondary, fontSize: 12 }}>Planejado</Text>
              <Text style={{ color: palette.navy, fontWeight: "800", fontSize: 22, marginTop: 4 }}>
                {formato(planejado)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: palette.surfaceAlt,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text style={{ color: palette.secondary, fontSize: 12 }}>Produzido</Text>
              <Text style={{ color: palette.navy, fontWeight: "800", fontSize: 22, marginTop: 4 }}>
                {formato(produzido)}
              </Text>
            </View>
          </View>

          {/* Progresso */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 18,
              marginBottom: 9,
            }}
          >
            <Text style={{ color: palette.secondary, fontSize: 12 }}>Progresso da produção</Text>
            <Text style={{ color: palette.navy, fontWeight: "800", fontSize: 14 }}>
              {percentual}%
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: palette.border,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 8,
                width: `${percentual}%`,
                backgroundColor: "#0E9DB1",
                borderRadius: 20,
              }}
            />
          </View>

          {/* Area de acao. O alinhamento fica na View, nao no texto. */}
          <View
            style={{
              backgroundColor: "#17395C",
              borderRadius: 12,
              marginTop: 20,
              minHeight: 48,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                Ver detalhes da OP
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ==========================================
// TELA DE ORDENS DE PRODUÇÃO
// ==========================================

export default function OrdensScreen() {
  const { palette } = useAppTheme();
  const colors = getColors(palette);
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
          borderColor: palette.border,
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
            gap: 18,
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
