
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';

type HistoryFilter = 'all' | 'today' | 'week';

export default function HistoryScreen() {
  const { user } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<
    TeacherEventAttendance[]
  >([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const loadHistory = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setTeacherEvents([]);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await getProfile(user.id);
      const currentRole = profile?.role ?? 'student';

      setRole(currentRole);

      if (currentRole === 'teacher') {
        const events = await getTeacherEventAttendance(user.id);
        setTeacherEvents(events);
        setRecords([]);
      } else {
        const attendance = await getAttendanceHistory(user.id);
        setRecords(attendance);
        setTeacherEvents([]);
      }
    } catch (err) {
      console.error('Failed to load attendance history:', err);
      setError(
        'Unable to load your attendance history. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const isWithinFilter = useCallback(
    (dateString: string) => {
      if (filter === 'all') return true;

      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return false;

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      if (filter === 'today') {
        return date >= startOfToday && date <= now;
      }

      // Start the week on Monday.
      const startOfWeek = new Date(startOfToday);
      const day = startOfWeek.getDay();

      startOfWeek.setDate(
        startOfWeek.getDate() - (day === 0 ? 6 : day - 1),
      );

      return date >= startOfWeek && date <= now;
    },
    [filter],
  );

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((item) => {
      const title = item.eventTitle ?? '';
      const eventId = item.eventId ?? '';

      const matchesSearch =
        !term ||
        title.toLowerCase().includes(term) ||
        eventId.toLowerCase().includes(term);

      return matchesSearch && isWithinFilter(item.scannedAt);
    });
  }, [records, search, isWithinFilter]);

  const filteredTeacherEvents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teacherEvents.filter((event) => {
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.eventId.toLowerCase().includes(term) ||
        event.eventCode.toLowerCase().includes(term);

      const matchesDate =
        filter === 'all' ||
        event.attendees.some((attendee) =>
          isWithinFilter(attendee.scannedAt),
        );

      return matchesSearch && matchesDate;
    });
  }, [teacherEvents, search, filter, isWithinFilter]);

  const todayCount = records.filter((item) => {
    const date = new Date(item.scannedAt);
    const now = new Date();

    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }).length;

  const totalAttendees = teacherEvents.reduce(
    (sum, event) => sum + (Number(event.attendeeCount) || 0),
    0,
  );

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function shortId(id: string) {
    return id ? `…${id.slice(-8)}` : 'Unknown student';
  }

  function renderHeader() {
    const isTeacher = role === 'teacher';

    return (
      <View>
        <View style={styles.topRow}>
          <View style={styles.headingContainer}>
            <Text style={styles.eyebrow}>
              {isTeacher ? 'TEACHER DASHBOARD' : 'STUDENT DASHBOARD'}
            </Text>

            <Text style={styles.title}>
              {isTeacher ? 'My Events' : 'Attendance History'}
            </Text>

            <Text style={styles.subtitle}>
              {isTeacher
                ? 'Review your events and student attendance.'
                : 'Keep track of your school event attendance.'}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh attendance history"
            onPress={() => void loadHistory()}
            disabled={loading}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              {isTeacher ? '📅' : '✓'}
            </Text>

            <Text style={styles.statNumber}>
              {isTeacher ? teacherEvents.length : records.length}
            </Text>

            <Text style={styles.statLabel}>
              {isTeacher ? 'Total Events' : 'Total Scans'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              {isTeacher ? '👥' : '🗓️'}
            </Text>

            <Text style={styles.statNumber}>
              {isTeacher ? totalAttendees : todayCount}
            </Text>

            <Text style={styles.statLabel}>
              {isTeacher ? 'Total Attendees' : 'Scans Today'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Records</Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              isTeacher
                ? 'Search event title or code...'
                : 'Search event title or ID...'
            }
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search attendance records"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
            >
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.filterRow}>
          {([
            { label: 'All', value: 'all' },
            { label: 'Today', value: 'today' },
            { label: 'This week', value: 'week' },
          ] as const).map((option) => {
            const active = filter === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(option.value)}
                style={[
                  styles.filterButton,
                  active && styles.activeFilter,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.activeFilterText,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderStudentRecord({
    item,
  }: {
    item: AttendanceRecord;
  }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.eventIconBox}>
            <Text style={styles.eventIcon}>✓</Text>
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>
              {item.eventTitle || 'Untitled Event'}
            </Text>

            <Text style={styles.eventMeta}>
              Event ID: {item.eventId}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Recorded</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.dateRow}>
          <Text style={styles.dateIcon}>◷</Text>

          <View>
            <Text style={styles.dateLabel}>Attendance scanned</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.scannedAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderTeacherEvent({
    item,
  }: {
    item: TeacherEventAttendance;
  }) {
    const attendees =
      filter === 'all'
        ? item.attendees
        : item.attendees.filter((attendee) =>
            isWithinFilter(attendee.scannedAt),
          );

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.eventIconBox}>
            <Text style={styles.eventIcon}>📅</Text>
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventMeta}>
              Event ID: {item.eventId}
            </Text>
          </View>
        </View>

        <View style={styles.codeBox}>
          <View style={styles.codeInfo}>
            <Text style={styles.codeLabel}>EVENT CODE</Text>
            <Text style={styles.codeValue}>{item.eventCode}</Text>
          </View>

          <View style={styles.attendeeBadge}>
            <Text style={styles.attendeeNumber}>
              {item.attendeeCount}
            </Text>
            <Text style={styles.attendeeLabel}>attendees</Text>
          </View>
        </View>

        <Text style={styles.attendeesHeading}>
          Student Attendance ({attendees.length})
        </Text>

        {attendees.length === 0 ? (
          <Text style={styles.noAttendees}>
            {filter === 'all'
              ? 'No students have scanned this event yet.'
              : 'No attendance scans in this time range.'}
          </Text>
        ) : (
          attendees.map((attendee) => (
            <View
              key={`${item.eventId}-${attendee.studentId}-${attendee.scannedAt}`}
              style={styles.attendeeRow}
            >
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>S</Text>
              </View>

              <View style={styles.attendeeInfo}>
                <Text style={styles.studentName}>
                  Student {shortId(attendee.studentId)}
                </Text>

                <Text style={styles.eventMeta}>
                  {formatDate(attendee.scannedAt)}
                </Text>
              </View>

              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))
        )}
      </View>
    );
  }

  function renderEmptyState() {
    const isTeacher = role === 'teacher';

    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>
          {error
            ? '⚠️'
            : search || filter !== 'all'
              ? '🔎'
              : '📋'}
        </Text>

        <Text style={styles.emptyTitle}>
          {error
            ? 'Something went wrong'
            : search || filter !== 'all'
              ? 'No matching records'
              : isTeacher
                ? 'No events yet'
                : 'No attendance yet'}
        </Text>

        <Text style={styles.emptyText}>
          {error ||
            (search || filter !== 'all'
              ? 'Try changing your search or selecting another filter.'
              : isTeacher
                ? 'Events you create will appear here.'
                : 'Scan an event QR code to record your attendance.')}
        </Text>

        {error !== '' && (
          <Pressable
            style={styles.retryButton}
            onPress={() => void loadHistory()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (loading && role === null) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.stateText}>
          Loading attendance history...
        </Text>
      </View>
    );
  }

  if (role === 'teacher') {
    return (
      <View style={styles.container}>
        <FlatList<TeacherEventAttendance>
          data={filteredTeacherEvents}
          keyExtractor={(item) => item.eventId}
          renderItem={renderTeacherEvent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void loadHistory()}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList<AttendanceRecord>
        data={filteredRecords}
        keyExtractor={(item, index) =>
          `${item.eventId}-${item.scannedAt}-${index}`
        }
        renderItem={renderStudentRecord}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void loadHistory()}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 36,
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headingContainer: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 27,
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 27,
  },
  statCard: {
    flex: 1,
    minHeight: 118,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 19,
    marginBottom: 7,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    minHeight: 49,
    marginBottom: 13,
  },
  searchIcon: {
    color: COLORS.textSecondary,
    fontSize: 25,
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingVertical: 12,
  },
  clearText: {
    color: COLORS.textSecondary,
    fontSize: 17,
    paddingLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 17,
  },
  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  activeFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  eventMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: 'rgba(46, 160, 110, 0.13)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 6,
  },
  statusText: {
    color: '#2EA06E',
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 23,
    color: COLORS.primary,
    marginRight: 11,
  },
  dateLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  dateValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 13,
    borderRadius: 13,
    marginTop: 16,
    marginBottom: 18,
  },
  codeInfo: {
    flex: 1,
  },
  codeLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  codeValue: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  attendeeBadge: {
    alignItems: 'center',
    paddingLeft: 12,
  },
  attendeeNumber: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  attendeeLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  attendeesHeading: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 11,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  studentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  studentAvatarText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  attendeeInfo: {
    flex: 1,
  },
  studentName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  checkmark: {
    color: '#2EA06E',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  noAttendees: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    paddingVertical: 8,
  },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    minHeight: 220,
  },
  emptyIcon: {
    fontSize: 37,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 17,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
});
