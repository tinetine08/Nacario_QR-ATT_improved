import { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';

function SettingRow({ icon, title, description, onPress, trailing }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; onPress?: () => void; trailing?: React.ReactNode }) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={21} color={COLORS.primary} /></View>
      <View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const [confirmScan, setConfirmScan] = useState(true);
  const [showTips, setShowTips] = useState(true);

  const handleSignOut = () => Alert.alert('Sign out?', 'You will need to sign in again to access your attendance records.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: async () => { const result = await signOut(); if (result.error) Alert.alert('Sign out failed', result.error); else router.replace('/login'); } },
  ]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>PERSONALIZE</Text><Text style={styles.title}>App Settings</Text></View>
          <View style={styles.headerIcon}><Ionicons name="options-outline" size={23} color={COLORS.primary} /></View>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.accountIcon}><Ionicons name="shield-checkmark" size={25} color="#34D399" /></View>
          <View style={{ flex: 1 }}><Text style={styles.accountTitle}>Your account is protected</Text><Text style={styles.accountText}>Signed in as {user?.email ?? 'your account'}</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Attendance Preferences</Text>
        <View style={styles.group}>
          <SettingRow icon="checkmark-circle-outline" title="Scan confirmation" description="Show a confirmation after scanning a QR code" trailing={<Switch value={confirmScan} onValueChange={setConfirmScan} trackColor={{ false: '#334155', true: '#2563EB' }} thumbColor="#FFFFFF" />} />
          <View style={styles.separator} />
          <SettingRow icon="bulb-outline" title="Helpful tips" description="Show guidance for using the attendance app" trailing={<Switch value={showTips} onValueChange={setShowTips} trackColor={{ false: '#334155', true: '#2563EB' }} thumbColor="#FFFFFF" />} />
        </View>
        <Text style={styles.note}>These preferences control this settings screen only. Push notifications and system-wide preferences are not enabled in this version.</Text>

        <Text style={styles.sectionTitle}>Shortcuts</Text>
        <View style={styles.group}>
          <SettingRow icon="person-circle-outline" title="My Profile" description="Review your account details" onPress={() => router.push('/(tabs)/profile')} />
          <View style={styles.separator} />
          <SettingRow icon="time-outline" title="Attendance History" description="Review your recorded attendance" onPress={() => router.push('/(tabs)/history')} />
          <View style={styles.separator} />
          <SettingRow icon="scan-outline" title="Scan QR Code" description="Open the event attendance scanner" onPress={() => router.push('/(tabs)/scan')} />
        </View>

        <Text style={styles.sectionTitle}>Privacy & About</Text>
        <View style={styles.group}>
          <SettingRow icon="camera-outline" title="Camera access" description="Camera is used only when you open the QR scanner" />
          <View style={styles.separator} />
          <SettingRow icon="information-circle-outline" title="About QR Attendance" description="School event attendance management · Version 1.1.0" />
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color="#F87171" /><Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
        <Text style={styles.footer}>Developed by Ma. Christine Mae Nacario</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingTop: 28, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800' },
  headerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 25 },
  accountIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#173B32', alignItems: 'center', justifyContent: 'center' },
  accountTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  accountText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 5 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 11, marginTop: 4 },
  group: { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  rowIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#1D3557', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 },
  rowDescription: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 51 },
  note: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 17, marginBottom: 24, marginTop: 1 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1, borderColor: '#7F1D1D', backgroundColor: '#291923', padding: 15, borderRadius: 16, marginTop: 20 },
  signOutText: { color: '#F87171', fontWeight: '800', fontSize: 14 },
  footer: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 10, marginTop: 22 },
});
