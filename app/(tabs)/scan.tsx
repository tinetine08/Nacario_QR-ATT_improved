
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS } from '@/constants/colors';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState('');

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;

    setScanned(true);
    setLastData(data);
  }

  function resetScanner() {
    setLastData('');
    setScanned(false);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.message}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons
            name="camera-outline"
            size={42}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.message}>
          QR Attendance needs camera access to scan school event QR codes.
          Allow access to continue.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => void requestPermission()}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="qr-code-outline"
            size={25}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>
            Scan your school's event QR code to record attendance.
          </Text>
        </View>
      </View>

      <View style={styles.cameraCard}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={
              scanned ? undefined : handleBarcodeScanned
            }
          />

          <View pointerEvents="none" style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {!scanned && <View style={styles.scanLine} />}
            </View>
          </View>

          <View style={styles.cameraHint}>
            <Ionicons
              name="scan-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.cameraHintText}>
              {scanned ? 'QR code detected' : 'Align QR code inside the frame'}
            </Text>
          </View>
        </View>

        <View style={styles.instruction}>
          <Ionicons
            name="bulb-outline"
            size={21}
            color={COLORS.primary}
          />
          <Text style={styles.instructionText}>
            Keep your camera steady and make sure the QR code is clearly
            visible.
          </Text>
        </View>
      </View>

      {scanned && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeading}>
            <Ionicons
              name="checkmark-circle"
              size={25}
              color="#2EAA72"
            />
            <Text style={styles.resultTitle}>QR Code Scanned</Text>
          </View>

          <Text style={styles.resultLabel}>Scanned data</Text>
          <Text selectable style={styles.resultData}>
            {lastData}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              Alert.alert(
                'QR Code Scanned',
                'The QR code was read successfully. Make sure your attendance validation and saving logic is connected to this scanner.',
                [
                  {
                    text: 'Scan Again',
                    onPress: resetScanner,
                  },
                  { text: 'OK' },
                ],
              );
            }}
          >
            <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Review Scan</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={resetScanner}>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.secondaryButtonText}>Scan Another QR</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.footer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={17}
          color={COLORS.textSecondary}
        />
        <Text style={styles.footerText}>
          QR Attendance · Event Scanner
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 22,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    marginBottom: 20,
  },
  cameraCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cameraContainer: {
    height: 340,
    backgroundColor: '#111111',
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 230,
    height: 230,
    position: 'relative',
  },
  corner: {
    width: 32,
    height: 32,
    position: 'absolute',
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 9,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 9,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 9,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 9,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#45E0A8',
  },
  cameraHint: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
  },
  cameraHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 18,
  },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 7,
  },
  resultData: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 18,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
