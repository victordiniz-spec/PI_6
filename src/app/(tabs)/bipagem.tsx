
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from "expo-router";

import {
  Camera,
  CheckCircle2,
  RotateCcw,
  ScanLine,
  ShieldCheck,
} from "lucide-react-native";

import { useCallback, useRef, useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// Cores do Figma do PRODSYNC
const theme = {
  background: "#D3DCE6",
  navy: "#123450",
  ink: "#172F42",
  muted: "#5B6E7C",
  teal: "#007F80",
  white: "#FFFFFF",
  border: "#DCE5EB",
  success: "#167046",
  successBg: "#E6F5EC",
};

export default function BipagemScreen() {
  const router = useRouter();

  const { op } = useLocalSearchParams<{
    op?: string;
  }>();

  // Permissão para acessar a câmera
  const [permission, requestPermission] =
    useCameraPermissions();

  // Controle da câmera e resultados
  const [focused, setFocused] = useState(false);

  const [result, setResult] = useState<string | null>(
    null
  );

  const [reads, setReads] = useState(0);

  // Impede leituras duplicadas
  const locked = useRef(false);

  // Ativa a câmera ao entrar na tela
  // Desativa ao sair
  useFocusEffect(
    useCallback(() => {
      locked.current = false;

      setResult(null);
      setFocused(true);

      return () => {
        locked.current = true;
        setFocused(false);
      };
    }, [])
  );

  // Função executada ao identificar um QR Code
  function handleQRCodeScanned({
    data,
  }: {
    data: string;
  }) {
    if (locked.current) {
      return;
    }

    locked.current = true;

    setResult(data);

    setReads((current) => current + 1);
  }

  // Permite ler outro QR Code
  function handleScanAgain() {
    locked.current = false;

    setResult(null);
  }

  // Navegação para os detalhes da OP
  function handleOpenOrder() {
    if (!op) {
      return;
    }

    // Caminho concreto para a rota dinâmica.
    // A conversão Href é temporária enquanto
    // os tipos do Expo Router são regenerados.
    const destination =
      `/ordem/${encodeURIComponent(op)}` as Href;

    router.push(destination);
  }

  // Verifica se a câmera deve funcionar
  const cameraReady =
    focused &&
    result === null &&
    permission?.granted === true;

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <Text style={styles.brand}>
            PRODSYNC / JM FORROS
          </Text>

          <Text style={styles.title}>
            Bipagem
          </Text>

          <Text style={styles.subtitle}>
            Leia um QR Code de ordem ou etiqueta
            para testar a câmera.
          </Text>
        </View>

        {/* AVISO DE TESTE */}
        <View style={styles.notice}>
          <ShieldCheck
            size={18}
            color={theme.teal}
          />

          <Text style={styles.noticeText}>
            Modo de teste: leitura local,
            sem validação no Sankhya.
          </Text>
        </View>

        {/* OP INFORMADA */}
        {!!op && (
          <View style={styles.opCard}>
            <Text style={styles.opLabel}>
              Ordem informada
            </Text>

            <Text style={styles.opNumber}>
              OP #{op}
            </Text>

            <Pressable
              onPress={handleOpenOrder}
              accessibilityRole="button"
            >
              <Text style={styles.opLink}>
                Ver detalhes da OP (teste)
              </Text>
            </Pressable>
          </View>
        )}

        {/* ÁREA PRINCIPAL DA BIPAGEM */}
        <View style={styles.scanCard}>
          {result === null ? (
            <>
              <View style={styles.sectionRow}>
                <ScanLine
                  size={24}
                  color={theme.navy}
                />

                <Text style={styles.sectionTitle}>
                  Leitor de QR Code
                </Text>
              </View>

              <Text style={styles.description}>
                Posicione o código dentro do quadro.
                A leitura será automática.
              </Text>

              {/* PERMISSÃO DA CÂMERA */}
              {!permission ? (
                <View style={styles.placeholder}>
                  <Text style={styles.description}>
                    Verificando permissão da câmera...
                  </Text>
                </View>
              ) : !permission.granted ? (
                <View style={styles.permissionCard}>
                  <Camera
                    size={42}
                    color={theme.navy}
                  />

                  <Text style={styles.sectionTitle}>
                    Permitir câmera
                  </Text>

                  <Text style={styles.descriptionCentered}>
                    O PRODSYNC precisa de acesso à
                    câmera para ler QR Codes.
                  </Text>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={() =>
                      void requestPermission()
                    }
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryText}>
                      Autorizar câmera
                    </Text>
                  </Pressable>
                </View>
              ) : cameraReady ? (
                // CÂMERA REAL
                <View style={styles.cameraContainer}>
                  <CameraView
                    style={styles.cameraFill}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                    onBarcodeScanned={
                      handleQRCodeScanned
                    }
                  />

                  {/* Moldura do leitor */}
                  <View
                    pointerEvents="none"
                    style={styles.overlay}
                  >
                    <View style={styles.scanFrame} />
                  </View>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.description}>
                    Preparando câmera...
                  </Text>
                </View>
              )}

              <Text style={styles.helpText}>
                Aponte para um QR Code impresso
                ou exibido em outra tela.
              </Text>
            </>
          ) : (
            // RESULTADO DA LEITURA
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <CheckCircle2
                  size={58}
                  color={theme.success}
                />
              </View>

              <Text style={styles.successTitle}>
                Leitura realizada!
              </Text>

              <Text style={styles.descriptionCentered}>
                O QR Code foi reconhecido.
                Sua validade ainda não foi verificada.
              </Text>

              <View style={styles.resultCard}>
                <Text style={styles.opLabel}>
                  Conteúdo lido
                </Text>

                <Text
                  selectable
                  style={styles.resultValue}
                >
                  {result}
                </Text>
              </View>

              <View style={styles.successNotice}>
                <Text style={styles.successText}>
                  ✓ Teste da câmera concluído
                </Text>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={handleScanAgain}
                accessibilityRole="button"
              >
                <RotateCcw
                  size={19}
                  color={theme.white}
                />

                <Text style={styles.primaryText}>
                  Ler outro QR Code
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* RODAPÉ */}
        <Text style={styles.footer}>
          Leituras nesta sessão: {reads}.
          Nenhuma etiqueta foi validada ou
          registrada no ERP.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS DA TELA
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
    gap: 20,
  },

  header: {
    gap: 5,
  },

  brand: {
    color: theme.teal,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 20,
  },

  title: {
    color: theme.ink,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },

  subtitle: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 22,
  },

  notice: {
    backgroundColor: "#E1F3F2",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  noticeText: {
    color: theme.teal,
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },

  opCard: {
    backgroundColor: theme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 8,
  },

  opLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  opNumber: {
    color: theme.ink,
    fontSize: 22,
    fontWeight: "700",
  },

  opLink: {
    color: theme.teal,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  scanCard: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },

  sectionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  sectionTitle: {
    color: theme.ink,
    fontSize: 20,
    fontWeight: "600",
  },

  description: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 22,
  },

  descriptionCentered: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },

  placeholder: {
    height: 260,
    borderRadius: 12,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  permissionCard: {
    minHeight: 260,
    borderRadius: 12,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 18,
  },

  cameraContainer: {
    height: 300,
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#101820",
    overflow: "hidden",
    position: "relative",
  },

  // Corrige o erro do absoluteFillObject
  cameraFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  scanFrame: {
    width: 210,
    height: 210,
    borderWidth: 3,
    borderColor: theme.white,
    borderRadius: 18,
  },

  helpText: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },

  successContent: {
    alignItems: "center",
    gap: 18,
    paddingVertical: 10,
  },

  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.successBg,
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    color: theme.success,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  resultCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    gap: 8,
  },

  resultValue: {
    color: theme.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },

  successNotice: {
    backgroundColor: theme.successBg,
    padding: 14,
    borderRadius: 12,
    width: "100%",
  },

  successText: {
    color: theme.success,
    textAlign: "center",
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: theme.navy,
    minHeight: 56,
    borderRadius: 12,
    width: "100%",
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  primaryText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    color: theme.muted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
  },
});
