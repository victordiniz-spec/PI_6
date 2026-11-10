import { useCallback, useState, type ComponentType } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  CircleHelp,
  Info,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  TabletSmartphone,
  UserRound,
  Wifi,
} from "lucide-react-native";
import { ErroAPI, ordensProducaoApi } from "@/services/ordensProducao";
import { useAppTheme, type AppPalette } from "@/theme/colors";

const TOKEN_KEY = "prodsync_access_token";
const USER_KEY = "prodsync_authenticated_user";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "SUPERVISOR" | "OPERADOR";
};

type OptionIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type OptionCardProps = {
  title: string;
  subtitle: string;
  icon: OptionIcon;
  palette: AppPalette;
  onPress: () => void;
  disabled?: boolean;
};

// Card visual separado do botão: nunca posiciona ícone ou seta sobre o texto.
function OptionCard({
  title,
  subtitle,
  icon: Icon,
  palette,
  onPress,
  disabled = false,
}: OptionCardProps) {
  return (
    <View
      style={[
        styles.cardShell,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardTouch,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.cardRow}>
          <View
            style={[styles.iconBox, { backgroundColor: palette.surfaceAlt }]}
            pointerEvents="none"
          >
            <Icon size={24} color={palette.navy} strokeWidth={1.9} />
          </View>

          <View style={styles.cardText}>
            <Text style={[styles.optionTitle, { color: palette.text }]}>
              {title}
            </Text>
            <Text style={[styles.optionSubtitle, { color: palette.secondary }]}>
              {subtitle}
            </Text>
          </View>

          <View style={styles.arrowBox} pointerEvents="none">
            <ChevronRight size={22} color={palette.muted} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function MaisScreen() {
  const router = useRouter();
  const { appearance, palette, ready, setAppearance } = useAppTheme();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mudandoTema, setMudandoTema] = useState(false);
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [ultimoTeste, setUltimoTeste] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      SecureStore.getItemAsync(USER_KEY)
        .then((salvo) => {
          if (!ativo) return;
          if (!salvo) {
            setUsuario(null);
            return;
          }
          try {
            const dados = JSON.parse(salvo) as Usuario;
            setUsuario(dados?.id && dados?.nome && dados?.email ? dados : null);
          } catch {
            setUsuario(null);
          }
        })
        .catch(() => {
          if (ativo) setUsuario(null);
        });
      return () => {
        ativo = false;
      };
    }, []),
  );

  async function alternarTema(escuro: boolean) {
    if (mudandoTema) return;
    setMudandoTema(true);
    try {
      await setAppearance(escuro ? "dark" : "light");
    } catch {
      Alert.alert("Erro ao salvar", "Não foi possível salvar a aparência.");
    } finally {
      setMudandoTema(false);
    }
  }

  function abrirPerfil() {
    if (!usuario) {
      Alert.alert("Minha conta", "Não foi possível carregar os dados do usuário.");
      return;
    }
    Alert.alert(
      "Minha conta",
      `Nome: ${usuario.nome}\nE-mail: ${usuario.email}\nPerfil: ${usuario.perfil}\n\nAs permissões são gerenciadas no Mini ERP.`,
    );
  }

  async function testarConexao() {
    if (testandoConexao) return;
    setTestandoConexao(true);
    try {
      const lista = await ordensProducaoApi.listar();
      const horario = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setUltimoTeste(horario);
      Alert.alert(
        "Conexão estabelecida",
        `API do PRODSYNC acessível. ${lista.length} OP(s) recebida(s) às ${horario}.\n\nNenhum apontamento foi enviado ao Sankhya.`,
      );
    } catch (error) {
      if (error instanceof ErroAPI && error.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente para acessar a API.");
      } else {
        Alert.alert(
          "Falha de conexão",
          error instanceof Error ? error.message : "Não foi possível acessar a API.",
        );
      }
    } finally {
      setTestandoConexao(false);
    }
  }

  function abrirTablet() {
    Alert.alert(
      "Tablet e máquina",
      "O vínculo do tablet com uma máquina depende da autorização do administrador no PRODSYNC. O operador não pode alterá-lo aqui.",
    );
  }

  function abrirSeguranca() {
    Alert.alert(
      "Segurança",
      "O acesso utiliza a autenticação do PRODSYNC. As permissões e o vínculo da máquina são administrados no sistema Web.",
    );
  }

  function abrirSuporte() {
    Alert.alert(
      "Ajuda e suporte",
      "Para consultar uma OP, abra a aba Ordens. Para problemas de acesso ou da máquina, procure o suporte interno da empresa.",
    );
  }

  async function sairDaConta() {
    if (saindo) return;
    setSaindo(true);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      const [tokenRestante, usuarioRestante] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (tokenRestante !== null || usuarioRestante !== null) {
        throw new Error("Não foi possível remover toda a sessão.");
      }
      setUsuario(null);
      // Navegação para src/app/index.tsx, que é a tela de login.
      router.replace("/");
    } catch (error) {
      console.error("Falha ao encerrar a sessão:", error);
      Alert.alert("Erro ao sair", "Não foi possível encerrar sua sessão.");
    } finally {
      setSaindo(false);
    }
  }

  function confirmarSaida() {
    Alert.alert("Sair do PRODSYNC", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void sairDaConta() },
    ]);
  }

  const cardColors = { backgroundColor: palette.surface, borderColor: palette.border };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.heading, { color: palette.text }]}>Mais opções</Text>
            <Text style={[styles.headingSubtitle, { color: palette.secondary }]}>
              Configurações e informações do aplicativo
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: palette.surfaceAlt }]}>
            <Info size={24} color={palette.navy} />
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: palette.secondary }]}>MINHA CONTA</Text>
        <OptionCard
          icon={UserRound}
          title={usuario?.nome ?? "Minha conta"}
          subtitle={usuario ? `${usuario.perfil} · ${usuario.email}` : "Consultar perfil e permissões"}
          palette={palette}
          onPress={abrirPerfil}
        />

        <Text style={[styles.sectionHeading, styles.sectionSpacing, { color: palette.secondary }]}>
          APARÊNCIA
        </Text>
        <View style={[styles.cardShell, styles.appearanceCard, cardColors]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: palette.surfaceAlt }]}>
              {appearance === "dark" ? (
                <Moon size={24} color={palette.navy} />
              ) : (
                <Sun size={24} color={palette.navy} />
              )}
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.optionTitle, { color: palette.text }]}>Modo escuro</Text>
              <Text style={[styles.optionSubtitle, { color: palette.secondary }]}>
                {appearance === "dark" ? "Ativado" : "Desativado"}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Ativar modo escuro"
              value={appearance === "dark"}
              onValueChange={(valor) => void alternarTema(valor)}
              disabled={!ready || mudandoTema}
              trackColor={{ false: palette.border, true: palette.switchTrack }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.hintSeparator, { backgroundColor: palette.border }]} />
          <Text style={[styles.hintText, { color: palette.secondary }]}>
            Sua escolha de aparência fica salva neste dispositivo.
          </Text>
        </View>

        <Text style={[styles.sectionHeading, styles.sectionSpacing, { color: palette.secondary }]}>
          DISPOSITIVO E SUPORTE
        </Text>
        <View style={styles.optionsStack}>
          <OptionCard
            icon={TabletSmartphone}
            title="Tablet e máquina"
            subtitle="Identificação do dispositivo e vínculo autorizado com a máquina"
            palette={palette}
            onPress={abrirTablet}
          />
          <OptionCard
            icon={Wifi}
            title="Testar conexão"
            subtitle={testandoConexao ? "Consultando a API..." : ultimoTeste ? `Última verificação às ${ultimoTeste}` : "Verificar a comunicação com o servidor PRODSYNC"}
            palette={palette}
            onPress={() => void testarConexao()}
            disabled={testandoConexao}
          />
          <OptionCard
            icon={ShieldCheck}
            title="Segurança"
            subtitle="Sessão autenticada, permissões e proteção de acesso"
            palette={palette}
            onPress={abrirSeguranca}
          />
          <OptionCard
            icon={CircleHelp}
            title="Ajuda e suporte"
            subtitle="Orientações de uso e contato com o suporte interno"
            palette={palette}
            onPress={abrirSuporte}
          />
        </View>

        <View style={[styles.cardShell, styles.logoutShell, cardColors]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            onPress={confirmarSaida}
            disabled={saindo}
            style={({ pressed }) => [styles.logoutTouch, pressed && styles.pressed]}
          >
            <View style={styles.logoutRow}>
              <View style={styles.logoutIcon}>
                {saindo ? (
                  <ActivityIndicator color={palette.danger} />
                ) : (
                  <LogOut size={23} color={palette.danger} />
                )}
              </View>
              <Text style={[styles.logoutText, { color: palette.danger }]}>
                {saindo ? "Encerrando sessão..." : "Sair da conta"}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.muted }]}>
            PRODSYNC · Controle de Produção
          </Text>
          <Text style={[styles.footerSubtext, { color: palette.muted }]}>
            Preferências locais do aplicativo
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  headerText: { flex: 1, paddingRight: 12 },
  heading: { fontSize: 28, lineHeight: 36, fontWeight: "800" },
  headingSubtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  sectionSpacing: { marginTop: 32 },
  optionsStack: { gap: 16 },
  cardShell: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardTouch: {
    minHeight: 104,
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconBox: {
    width: 52,
    height: 52,
    flexShrink: 0,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 8,
  },
  optionTitle: { fontSize: 16, lineHeight: 23, fontWeight: "800" },
  optionSubtitle: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  arrowBox: {
    width: 25,
    height: 30,
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  appearanceCard: { paddingHorizontal: 16, paddingVertical: 20 },
  hintSeparator: { height: 1, marginTop: 18, marginBottom: 14 },
  hintText: { fontSize: 12, lineHeight: 19 },
  logoutShell: { marginTop: 30 },
  logoutTouch: { minHeight: 68, paddingHorizontal: 18, justifyContent: "center" },
  logoutRow: { flexDirection: "row", alignItems: "center" },
  logoutIcon: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  logoutText: { fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.65 },
  footer: { alignItems: "center", marginTop: 30 },
  footerText: { fontSize: 12, textAlign: "center" },
  footerSubtext: { fontSize: 11, marginTop: 6, textAlign: "center" },
});
