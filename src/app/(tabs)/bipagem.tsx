
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
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

const colors = {
  background: "#F3F6F8",
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
  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<string | null>(null);

  const scanLocked = useRef(false);

  // Ativa a câmera ao entrar na aba.
  // Desativa ao sair para outra tela.
  useFocusEffect(
    useCallback(() => {
      scanLocked.current = false;
      setScanning(true);
      setResult(null);

      return () => {
        scanLocked.current = true;
        setScanning(false);
      };
    }, [])
  );

  function handleQRCodeScanned({
    data,
  }: {
    data: string;
  }) {
    // Evita várias leituras do mesmo QR Code
    if (scanLocked.current) {
      return;
    }

    scanLocked.current = true;

    setResult(data);
    setScanning(false);
  }

  function handleScanAgain() {
    scanLocked.current = false;
    setResult(null);
    setScanning(true);
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.brand}>
            PRODSYNC / JM FORROS
          </Text>

          <Text style={styles.title}>
            Bipagem
          </Text>

          <Text style={styles.subtitle}>
            Leitura de QR Code para identificação
            de ordens e pacotes.
          </Text>
        </View>

        {/* Aviso de ambiente de testes */}
        <View style={styles.testNotice}>
          <ShieldCheck
            size={18}
            color={colors.teal}
          />

          <Text style={styles.testNoticeText}>
            Ambiente de testes — sem integração com o Sankhya
          </Text>
        </View>

        {result !== null ? (
          // Leitura realizada com sucesso
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <CheckCircle2
                size={56}
                color={colors.success}
                strokeWidth={1.7}
              />
            </View>

            <Text style={styles.successTitle}>
              Leitura realizada!
            </Text>

            <Text style={styles.successDescription}>
              O QR Code foi identificado com sucesso.
            </Text>

            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>
                Conteúdo identificado
              </Text>

              <Text
                style={styles.resultValue}
                selectable
              >
                {result}
              </Text>
            </View>

            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationText}>
                ✓ Teste concluído com sucesso
              </Text>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={handleScanAgain}
            >
              <RotateCcw
                size={20}
                color={colors.white}
              />

              <Text style={styles.primaryButtonText}>
                Ler outro QR Code
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.scanCard}>
            <View style={styles.scanHeading}>
              <ScanLine
                size={24}
                color={colors.navy}
              />

              <Text style={styles.sectionTitle}>
                Leitor de QR Code
              </Text>
            </View>

            <Text style={styles.instructions}>
              Posicione o QR Code dentro da área
              indicada para realizar a leitura.
            </Text>

            {/* Permissões da câmera */}
            {!permission ? (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.placeholderText}>
                  Verificando acesso à câmera...
                </Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.permissionBox}>
                <Camera
                  size={46}
                  color={colors.navy}
                />

                <Text style={styles.permissionTitle}>
                  Permissão necessária
                </Text>

                <Text style={styles.permissionText}>
                  O PRODSYNC precisa de acesso à
                  câmera para ler os QR Codes.
                </Text>

                <Pressable
                  style={styles.primaryButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.primaryButtonText}>
                    Permitir câmera
                  </Text>
                </Pressable>
              </View>
            ) : scanning ? (
              // Câmera real do dispositivo
              <View style={styles.cameraContainer}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  active={scanning}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={
                    scanning
                      ? handleQRCodeScanned
                      : undefined
                  }
                />

                {/* Moldura do leitor */}
                <View
                  pointerEvents="none"
                  style={styles.scanOverlay}
                >
                  <View style={styles.scanFrame} />
                </View>
              </View>
            ) : null}

            <Text style={styles.cameraHint}>
              A leitura será realizada automaticamente.
            </Text>
          </View>
        )}

        <Text style={styles.footerNote}>
          Nenhuma informação será enviada ao ERP nesta etapa.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },

  header: {
    gap: 5,
  },

  brand: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    color: colors.ink,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },

  testNotice: {
    backgroundColor: "#E1F3F2",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  testNoticeText: {
    flex: 1,
    color: colors.teal,
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 19,
  },

  scanCard: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },

  scanHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.ink,
  },

  instructions: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },

  cameraContainer: {
    height: 300,
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#101820",
    overflow: "hidden",
  },

  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  scanFrame: {
    width: 210,
    height: 210,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 18,
    backgroundColor: "transparent",
  },

  cameraPlaceholder: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
  },

  placeholderText: {
    color: colors.muted,
    fontSize: 14,
  },

  permissionBox: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
  },

  permissionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },

  permissionText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: colors.navy,
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  cameraHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },

  successCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    gap: 18,
    alignItems: "center",
  },

  successIcon: {
    backgroundColor: colors.successBg,
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.success,
    textAlign: "center",
  },

  successDescription: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },

  resultBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    gap: 8,
  },

  resultLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },

  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    color: colors.ink,
  },

  confirmationBox: {
    width: "100%",
    backgroundColor: colors.successBg,
    padding: 14,
    borderRadius: 12,
  },

  confirmationText: {
    color: colors.success,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },

  footerNote: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
});
