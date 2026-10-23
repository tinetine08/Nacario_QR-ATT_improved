import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';

type DashboardCounts = {
  users: number;
  events: number;
  attendance: number;
};

type ModuleItem = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
};

const MODULES: ModuleItem[] = [
  {
    title: 'Student Management',
    description: 'View and manage student accounts.',
    icon: 'people-outline',
    route: '/admin/students',
    color: '#60A5FA',
  },
  {
    title: 'Teacher Management',
    description: 'View and manage teacher accounts.',
    icon: 'school-outline',
    route: '/admin/teachers',
    color: '#A78BFA',
  },
  {
    title: 'Attendance Records',
    description: 'Review student attendance records.',
    icon: 'clipboard-outline',
    route: '/admin/attendance',
    color: '#34D399',
  },
  {
    title: 'QR Codes & Events',
    description: 'Create events and manage attendance QR codes.',
    icon: 'qr-code-outline',
    route: '/admin/events',
    color: '#FBBF24',
  },
  {
    title: 'Reports & Analytics',
    description: 'Review attendance summaries and totals.',
    icon: 'bar-chart-outline',
    route: '/admin/reports',
    color: '#F472B6',
  },
];

export default function AdminScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [counts, setCounts] = useState<DashboardCounts>({
    users: 0,
    events: 0,
    attendance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('Administrator');

  const currentDate = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!session?.user?.id) {
        router.replace('/login');
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        // Verify that the signed-in user is an administrator.
        const profile = await getProfile(session.user.id);

        if (!profile || profile.role !== 'admin') {
          router.replace('/(tabs)');
          return;
        }

        setAdminName(
          profile.full_name?.trim() || 'Administrator'
        );

        // Load the three system totals concurrently.
        const [usersResult, eventsResult, attendanceResult] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true }),

            supabase
              .from('events')
              .select('*', { count: 'exact', head: true }),

            supabase
              .from('attendance')
              .select('*', { count: 'exact', head: true }),
          ]);

        if (usersResult.error) throw usersResult.error;
        if (eventsResult.error) throw eventsResult.error;
        if (attendanceResult.error) throw attendanceResult.error;

        setCounts({
          users: usersResult.count ?? 0,
          events: eventsResult.count ?? 0,
          attendance: attendanceResult.count ?? 0,
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard information.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session?.user?.id, router]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the admin account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();

              if (result?.error) {
                Alert.alert(
                  'Sign Out Failed',
                  typeof result.error === 'string'
                    ? result.error
                    : 'Unable to sign out. Please try again.'
                );
                return;
              }

              router.replace('/login');
            } catch {
              Alert.alert(
                'Sign Out Failed',
                'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const openModule = (route: string) => {
    router.push(route as any);
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          { backgroundColor: `${color}20` },
        ]}
      >
        <Ionicons name={icon} size={23} color={color} />
      </View>

      <Text style={styles.statValue}>
        {value.toLocaleString()}
      </Text>

      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadDashboard(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Dashboard Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>QR-ATT • ADMIN</Text>
            <Text style={styles.heading}>Dashboard</Text>
            <Text style={styles.subtitle}>
              School attendance management
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#F87171"
            />
          </TouchableOpacity>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons
              name="shield-checkmark"
              size={27}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.welcomeTitle}>
            Welcome, {adminName}
          </Text>

          <Text style={styles.welcomeText}>
            Manage school events, user accounts, and attendance
            records from one place.
          </Text>

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color="#DCE8FF"
            />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              System Overview
            </Text>
            <Text style={styles.sectionSubtitle}>
              Your attendance system at a glance
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => void loadDashboard(true)}
            disabled={refreshing || loading}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="Refresh dashboard"
          >
            <Ionicons
              name="refresh-outline"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />
            <Text style={styles.loadingText}>
              Loading dashboard...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                title="Registered Users"
                value={counts.users}
                icon="people-outline"
                color="#60A5FA"
              />

              <StatCard
                title="School Events"
                value={counts.events}
                icon="calendar-outline"
                color="#A78BFA"
              />

              <StatCard
                title="Attendance Records"
                value={counts.attendance}
                icon="checkmark-circle-outline"
                color="#34D399"
              />
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color="#F87171"
                />

                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>
                    Unable to load dashboard
                  </Text>
                  <Text style={styles.errorText}>
                    {error}
                  </Text>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => void loadDashboard()}
                  >
                    <Text style={styles.retryText}>
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionSubtitle}>
          Access your main administrative tools
        </Text>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => openModule('/admin/events')}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: '#FBBF2420' },
              ]}
            >
              <Ionicons
                name="qr-code-outline"
                size={24}
                color="#FBBF24"
              />
            </View>
            <Text style={styles.quickActionTitle}>
              Manage Events
            </Text>
            <Text style={styles.quickActionDescription}>
              Create school events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => openModule('/admin/attendance')}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: '#34D39920' },
              ]}
            >
              <Ionicons
                name="clipboard-outline"
                size={24}
                color="#34D399"
              />
            </View>
            <Text style={styles.quickActionTitle}>
              View Attendance
            </Text>
            <Text style={styles.quickActionDescription}>
              Review records
            </Text>
          </TouchableOpacity>
        </View>

        {/* Admin Modules */}
        <Text style={styles.sectionTitle}>
          Administration Modules
        </Text>
        <Text style={styles.sectionSubtitle}>
          Manage the different parts of your system
        </Text>

        <View style={styles.moduleList}>
          {MODULES.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.moduleCard}
              onPress={() => openModule(item.route)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View
                style={[
                  styles.moduleIcon,
                  { backgroundColor: `${item.color}20` },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={25}
                  color={item.color}
                />
              </View>

              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>
                  {item.title}
                </Text>
                <Text style={styles.moduleDescription}>
                  {item.description}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={15}
            color={COLORS.textSecondary}
          />
          <Text style={styles.footerText}>
            QR-ATT • Administrator Panel
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },

  heading: {
    color: COLORS.textPrimary,
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  logoutButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 21,
    marginBottom: 28,
  },

  welcomeIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#FFFFFF25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 9,
  },

  welcomeText: {
    color: '#FFFFFF',
    opacity: 0.94,
    fontSize: 13,
    lineHeight: 21,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF35',
  },

  dateText: {
    color: '#FFFFFF',
    fontSize: 11,
    flexShrink: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 29,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 11,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  statValue: {
    color: COLORS.textPrimary,
    fontSize: 23,
    fontWeight: '800',
  },

  statTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
  },

  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#3B2026',
    borderWidth: 1,
    borderColor: '#7F333D',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: '#FCA5A5',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 5,
  },

  errorText: {
    color: '#FECACA',
    fontSize: 12,
    lineHeight: 19,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#7F333D',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 29,
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },

  quickActionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  quickActionTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },

  quickActionDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },

  moduleList: {
    gap: 11,
    marginTop: 2,
  },

  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    gap: 13,
  },

  moduleIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moduleContent: {
    flex: 1,
  },

  moduleTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  moduleDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 29,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
