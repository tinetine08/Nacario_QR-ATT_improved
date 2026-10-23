
import { router } from 'expo-router';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { getAttendanceHistory, getTeacherEventSummary } from '@/lib/attendance';
import { getProfile } from '@/lib/profiles';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';

export default function Index() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ first: 0, second: 0, third: 0, role: 'student', loading: true });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) { setStats({ first: 0, second: 0, third: 0, role: 'student', loading: false }); return; }
    setRefreshing(true);
    try {
      const profile = await getProfile(user.id);
      const role = profile?.role ?? 'student';
      if (role === 'teacher') {
        const events = await getTeacherEventSummary(user.id);
        setStats({ first: events.length, second: events.reduce((sum, event) => sum + event.attendeeCount, 0), third: events.filter((event) => event.attendeeCount > 0).length, role, loading: false });
      } else {
        const records = await getAttendanceHistory(user.id);
        const now = new Date();
        const today = records.filter((record) => { const d = new Date(record.scannedAt); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate(); }).length;
        const month = records.filter((record) => { const d = new Date(record.scannedAt); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;
        setStats({ first: records.length, second: today, third: month, role, loading: false });
      }
    } catch (error) { console.warn('Unable to load dashboard statistics', error); }
    finally { setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { void loadStats(); }, [loadStats]));

  const goToScan = () => router.push('/scan');
  const goToHistory = () => router.push('/history');
  const goToProfile = () => router.push('/profile');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.brandIcon}>
              <Ionicons
                name="qr-code"
                size={25}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.brandText}>
              <Header title="QR Attendance" />
              <Text style={styles.brandSubtitle}>
                SCHOOL ATTENDANCE SYSTEM
              </Text>
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={goToProfile}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.textPrimary}
              />
            </Pressable>
          </View>
        </View>

        {/* Welcome section */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.greeting}>WELCOME!</Text>

            <Text style={styles.mainTitle}>
              School Event{'\n'}Attendance
            </Text>

            <Text style={styles.subtitle}>
              Make every attendance count. Scan QR codes
              to record your participation in school activities.
            </Text>
          </View>

          <View style={styles.qrIllustration}>
            <Ionicons
              name="qr-code"
              size={86}
              color={COLORS.primary}
            />
            <View style={styles.scanBadge}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#22C55E"
              />
            </View>
          </View>

          <View style={styles.welcomeFooter}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={COLORS.primary}
            />
            <Text style={styles.welcomeFooterText}>
              Fast, convenient, and organized attendance
            </Text>
          </View>
        </View>

        {/* Live account summary */}
        <View style={styles.statsHeadingRow}>
          <View>
            <Text style={styles.sectionTitle}>{stats.role === 'teacher' ? 'Teaching Overview' : 'My Attendance'}</Text>
            <Text style={styles.statsCaption}>Updated from your account records</Text>
          </View>
          <Pressable onPress={() => void loadStats()} style={styles.refreshButton} accessibilityRole="button" accessibilityLabel="Refresh attendance statistics">
            <Ionicons name="refresh-outline" size={19} color={COLORS.primary} />
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#1D3557' }]}><Ionicons name={stats.role === 'teacher' ? 'calendar-outline' : 'checkmark-done-outline'} size={20} color="#60A5FA" /></View>
            <Text style={styles.statValue}>{refreshing ? '—' : stats.first}</Text>
            <Text style={styles.statLabel}>{stats.role === 'teacher' ? 'Events created' : 'Total check-ins'}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#173B32' }]}><Ionicons name={stats.role === 'teacher' ? 'people-outline' : 'today-outline'} size={20} color="#34D399" /></View>
            <Text style={styles.statValue}>{refreshing ? '—' : stats.second}</Text>
            <Text style={styles.statLabel}>{stats.role === 'teacher' ? 'Attendees' : 'Today'}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#35264F' }]}><Ionicons name={stats.role === 'teacher' ? 'bar-chart-outline' : 'calendar-number-outline'} size={20} color="#C084FC" /></View>
            <Text style={styles.statValue}>{refreshing ? '—' : stats.third}</Text>
            <Text style={styles.statLabel}>{stats.role === 'teacher' ? 'Events with scans' : 'This month'}</Text>
          </View>
        </View>

        {/* Primary action */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <Text style={styles.sectionHint}>Quick access</Text>
        </View>

        <View style={styles.scanCard}>
          <View style={styles.scanCardIcon}>
            <Ionicons
              name="scan-outline"
              size={32}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.scanCardText}>
            <Text style={styles.scanCardTitle}>Scan QR Code</Text>
            <Text style={styles.scanCardDescription}>
              Scan an event QR code to record attendance.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward-circle"
            size={27}
            color={COLORS.primary}
          />
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={goToScan}
          accessibilityRole="button"
        >
          <Ionicons
            name="qr-code-outline"
            size={21}
            color="#FFFFFF"
          />
          <Text style={styles.primaryButtonText}>
            Start Scanning
          </Text>
          <Ionicons
            name="arrow-forward"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* Quick access cards */}
        <Text style={[styles.sectionTitle, styles.quickTitle]}>
          Quick Access
        </Text>

        <View style={styles.quickActions}>
          <Pressable
            style={styles.actionCard}
            onPress={goToHistory}
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, styles.historyIcon]}>
              <Ionicons
                name="time-outline"
                size={25}
                color="#60A5FA"
              />
            </View>

            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionDescription}>
              View attendance records
            </Text>

            <View style={styles.actionArrow}>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={COLORS.textSecondary}
              />
            </View>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={goToProfile}
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, styles.profileIcon]}>
              <Ionicons
                name="person-outline"
                size={25}
                color="#C084FC"
              />
            </View>

            <Text style={styles.actionTitle}>My Profile</Text>
            <Text style={styles.actionDescription}>
              Manage your account
            </Text>

            <View style={styles.actionArrow}>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={COLORS.textSecondary}
              />
            </View>
          </Pressable>
        </View>

        {/* How it works */}
        <Text style={[styles.sectionTitle, styles.howTitle]}>
          How It Works
        </Text>

        <View style={styles.stepsCard}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Open the scanner</Text>
              <Text style={styles.stepDescription}>
                Tap Start Scanning to open your camera.
              </Text>
            </View>

            <Ionicons
              name="camera-outline"
              size={23}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scan the event QR</Text>
              <Text style={styles.stepDescription}>
                Point your camera at the event's QR code.
              </Text>
            </View>

            <Ionicons
              name="qr-code-outline"
              size={23}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check your attendance</Text>
              <Text style={styles.stepDescription}>
                Review your recorded attendance in History.
              </Text>
            </View>

            <Ionicons
              name="checkmark-done-outline"
              size={23}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons
            name="school-outline"
            size={17}
            color={COLORS.textSecondary}
          />

          <Text style={styles.footerText}>
            Developed by Ma. Christine Mae Nacario
          </Text>
        </View>

        <Text style={styles.versionText}>
          QR Attendance {'\u2022'} School Event Management
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statsCaption: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  refreshButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 26 },
  statCard: { flex: 1, minHeight: 116, padding: 11, borderRadius: 17, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { color: COLORS.textPrimary, fontSize: 21, fontWeight: '800' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 3 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 35,
  },

  headerContainer: {
    marginBottom: 25,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  brandText: {
    flex: 1,
  },

  brandSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 3,
  },

  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  welcomeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 21,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  welcomeTextContainer: {
    paddingRight: 5,
  },

  greeting: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },

  mainTitle: {
    fontSize: 29,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 36,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  qrIllustration: {
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 18,
    width: 125,
    height: 115,
    borderRadius: 23,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  scanBadge: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 2,
  },

  welcomeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
  },

  welcomeFooterText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  scanCardIcon: {
    width: 51,
    height: 51,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanCardText: {
    flex: 1,
  },

  scanCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },

  scanCardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  primaryButton: {
    minHeight: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 13,
    paddingHorizontal: 16,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  quickTitle: {
    marginTop: 29,
    marginBottom: 14,
  },

  quickActions: {
    flexDirection: 'row',
    gap: 13,
  },

  actionCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  historyIcon: {
    backgroundColor: '#172C46',
  },

  profileIcon: {
    backgroundColor: '#30213F',
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  actionDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    minHeight: 34,
  },

  actionArrow: {
    alignSelf: 'flex-end',
    marginTop: 9,
  },

  howTitle: {
    marginTop: 29,
    marginBottom: 14,
  },

  stepsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    gap: 12,
  },

  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },

  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  stepDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 46,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 28,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  versionText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});
