
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { createEvent } from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';
import { getProfile, type Role } from '@/lib/profiles';

type EditTarget = 'start' | 'end';
type MessageType = 'success' | 'error' | 'info';

const QUICK_END_OPTIONS = [
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
];

function toLocalISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function formatDateTime(date: Date): string {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeacherScreen() {
  const { user } = useAuth();

  const [role, setRole] = useState<Role>('student');
  const [roleLoading, setRoleLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');

  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('info');
  const [saving, setSaving] = useState(false);

  const isAndroid = Platform.OS === 'android';

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadRole() {
        if (!user) {
          setRole('student');
          setRoleLoading(false);
          return;
        }

        setRoleLoading(true);

        try {
          const profile = await getProfile(user.id);

          if (active) {
            // Explicitly validate the role to avoid TypeScript errors.
            const currentRole: Role =
              profile?.role === 'teacher' ? 'teacher' : 'student';

            setRole(currentRole);
          }
        } catch (error) {
          console.error('Failed to load teacher profile:', error);

          if (active) {
            setRole('student');
          }
        } finally {
          if (active) {
            setRoleLoading(false);
          }
        }
      }

      void loadRole();

      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  function showMessage(
    text: string,
    type: MessageType = 'info',
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function openPicker(target: EditTarget) {
    setMessage('');
    setEditTarget(target);
    setEditingPart('date');
  }

  function onPickerChange(
    event: DateTimePickerEvent,
    selected?: Date,
  ) {
    if (!editTarget) return;

    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current =
      editTarget === 'start' ? startDate : endDate;

    const next = new Date(current);

    if (isAndroid && editingPart === 'date') {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );

      if (editTarget === 'start') {
        setStartDate(next);

        if (endDate.getTime() <= next.getTime()) {
          setEndDate(
            new Date(next.getTime() + 60 * 60 * 1000),
          );
        }
      } else {
        setEndDate(next);
      }

      setEditingPart('time');
      return;
    }

    if (isAndroid) {
      next.setHours(
        selected.getHours(),
        selected.getMinutes(),
        0,
        0,
      );
    } else {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
      next.setHours(
        selected.getHours(),
        selected.getMinutes(),
        0,
        0,
      );
    }

    if (editTarget === 'start') {
      setStartDate(next);

      if (endDate.getTime() <= next.getTime()) {
        setEndDate(
          new Date(next.getTime() + 60 * 60 * 1000),
        );
      }
    } else {
      setEndDate(next);
    }

    setEditTarget(null);
    setEditingPart('date');
  }

  function handleQuickEnd(ms: number) {
    setEndDate(new Date(startDate.getTime() + ms));
    setMessage('');
  }

  function resetForm() {
    setTitle('');
    setEventId('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 60 * 60 * 1000));
    setPayload(null);
    setMessage('');
    setEditTarget(null);
    setEditingPart('date');
  }

  async function handleCreateEvent() {
    if (saving) return;

    setMessage('');
    setPayload(null);

    const cleanTitle = title.trim();
    const cleanEventId = eventId.trim().toUpperCase();

    if (!cleanTitle || !cleanEventId) {
      showMessage(
        'Please enter both the event title and event code.',
        'error',
      );
      return;
    }

    if (cleanTitle.length < 3) {
      showMessage(
        'The event title must contain at least 3 characters.',
        'error',
      );
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      showMessage(
        'The end time must be later than the start time.',
        'error',
      );
      return;
    }

    const eventData = {
      eventId: cleanEventId,
      title: cleanTitle,
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    setSaving(true);

    try {
      const result = await createEvent(eventData);

      if (result.error) {
        console.error('Failed to create event:', result.error);

        showMessage(
          'Could not save the event. Check the event code and try again.',
          'error',
        );
        return;
      }

      const qrPayload = buildQRPayload(eventData);

      setEventId(cleanEventId);
      setPayload(qrPayload);

      showMessage(
        'Event created successfully! Your QR code is ready.',
        'success',
      );
    } catch (error) {
      console.error('Failed to create event:', error);

      showMessage(
        'An unexpected error occurred while creating the event.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  }

  async function sharePayload() {
    if (!payload) return;

    try {
      await Share.share({
        title: 'QR Attendance Event',
        message:
          `Event: ${title}\n` +
          `Event Code: ${eventId}\n` +
          `QR Payload: ${payload}`,
      });
    } catch (error) {
      console.error('Could not share QR payload:', error);
      showMessage('Unable to open the sharing menu.', 'error');
    }
  }

  if (roleLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <Text style={styles.loadingText}>
          Checking your account...
        </Text>
      </View>
    );
  }

  if (!user || role !== 'teacher') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={58}
          color={COLORS.textSecondary}
        />

        <Text style={styles.lockTitle}>Teachers Only</Text>

        <Text style={styles.lockSubtitle}>
          Only teacher accounts can create event QR codes.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons
            name="qr-code-outline"
            size={30}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.eyebrow}>TEACHER WORKSPACE</Text>
        <Text style={styles.title}>Create an Event</Text>
        <Text style={styles.subtitle}>
          Set up a school activity and generate a QR code for attendance.
        </Text>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons
          name="information-circle-outline"
          size={21}
          color={COLORS.primary}
        />
        <Text style={styles.infoText}>
          Students can scan the generated QR code using the Scan tab.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        <Text style={styles.sectionSubtitle}>
          Enter the information for your school event.
        </Text>

        <Text style={styles.label}>Event Title *</Text>
        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-outline"
            size={19}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setMessage('');
            }}
            placeholder="e.g. Founders Day Assembly"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={100}
            returnKeyType="next"
          />
        </View>

        <Text style={styles.helperText}>
          Use a clear name students will recognize.
        </Text>

        <Text style={styles.label}>Event Code *</Text>
        <View style={styles.inputContainer}>
          <Ionicons
            name="key-outline"
            size={19}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            value={eventId}
            onChangeText={(value) => {
              setEventId(value.toUpperCase());
              setMessage('');
            }}
            placeholder="e.g. EVT-2026-0002"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={40}
          />
        </View>

        <Text style={styles.helperText}>
          Use a unique event code for each activity.
        </Text>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Schedule</Text>

        <Text style={styles.label}>Start Date and Time</Text>
        <PickerField
          value={formatDateTime(startDate)}
          icon="sunny-outline"
          onPress={() => openPicker('start')}
        />

        <Text style={styles.label}>End Date and Time</Text>
        <PickerField
          value={formatDateTime(endDate)}
          icon="moon-outline"
          onPress={() => openPicker('end')}
        />

        <Text style={styles.label}>Quick Duration</Text>
        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.chipPressed,
              ]}
              onPress={() => handleQuickEnd(option.ms)}
            >
              <Text style={styles.chipText}>
                +{option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.helperText}>
          Choose a duration to calculate the end time.
        </Text>

        {message !== '' && (
          <View
            style={[
              styles.messageBox,
              messageType === 'success' && styles.successBox,
              messageType === 'error' && styles.errorBox,
            ]}
          >
            <Ionicons
              name={
                messageType === 'success'
                  ? 'checkmark-circle-outline'
                  : messageType === 'error'
                    ? 'alert-circle-outline'
                    : 'information-circle-outline'
              }
              size={20}
              color={
                messageType === 'success'
                  ? '#248A58'
                  : messageType === 'error'
                    ? '#D64545'
                    : COLORS.primary
              }
            />

            <Text
              style={[
                styles.messageText,
                messageType === 'success' && styles.successText,
                messageType === 'error' && styles.errorText,
              ]}
            >
              {message}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <AppButton
            theme="primary"
            title={saving ? 'Creating Event...' : 'Create Event QR'}
            icon="qr-code-outline"
            onPress={() => void handleCreateEvent()}
          />

          {saving && (
            <ActivityIndicator
              color={COLORS.primary}
              style={styles.savingIndicator}
            />
          )}
        </View>

        <Pressable
          onPress={resetForm}
          disabled={saving}
          style={styles.resetButton}
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={COLORS.textSecondary}
          />
          <Text style={styles.resetText}>Clear Form</Text>
        </Pressable>
      </View>

      {editTarget && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerHeading}>
            Select {editingPart === 'date' ? 'Date' : 'Time'}
          </Text>

          <DateTimePicker
            value={editTarget === 'start' ? startDate : endDate}
            mode={isAndroid ? editingPart : 'datetime'}
            display={isAndroid ? 'default' : 'spinner'}
            onChange={onPickerChange}
            minimumDate={
              editTarget === 'end' ? startDate : undefined
            }
          />

          {!isAndroid && (
            <Pressable
              style={styles.doneButton}
              onPress={() => setEditTarget(null)}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          )}

          {isAndroid && (
            <Text style={styles.pickerHint}>
              Select a date first, then select a time.
            </Text>
          )}
        </View>
      )}

      {payload && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons
              name="checkmark-circle"
              size={27}
              color="#248A58"
            />

            <View style={styles.resultHeaderText}>
              <Text style={styles.resultTitle}>QR Code Ready!</Text>
              <Text style={styles.resultSubtitle}>{title}</Text>
            </View>
          </View>

          <View style={styles.eventSummary}>
            <Text style={styles.summaryLabel}>EVENT CODE</Text>
            <Text style={styles.summaryValue}>{eventId}</Text>

            <Text style={styles.summaryLabel}>SCHEDULE</Text>
            <Text style={styles.summaryValue}>
              {formatDateTime(startDate)}
            </Text>
            <Text style={styles.summaryValue}>
              Until {formatDateTime(endDate)}
            </Text>
          </View>

          <View style={styles.qrBox}>
            <QRCode
              value={payload}
              size={210}
              backgroundColor="#FFFFFF"
              color="#111827"
            />
          </View>

          <Text style={styles.qrInstruction}>
            Have students scan this QR code using your app's Scan tab.
          </Text>

          <Pressable
            style={styles.shareButton}
            onPress={() => void sharePayload()}
          >
            <Ionicons
              name="share-social-outline"
              size={19}
              color="#FFFFFF"
            />
            <Text style={styles.shareButtonText}>
              Share QR Details
            </Text>
          </Pressable>

          <Pressable
            style={styles.anotherButton}
            onPress={resetForm}
          >
            <Ionicons
              name="add-circle-outline"
              size={19}
              color={COLORS.primary}
            />
            <Text style={styles.anotherButtonText}>
              Create Another Event
            </Text>
          </Pressable>

          <Text style={styles.payloadLabel}>QR DATA</Text>
          <Text selectable style={styles.payloadText}>
            {payload}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={16}
          color={COLORS.textSecondary}
        />
        <Text style={styles.footerText}>
          QR Attendance · Teacher Event Management
        </Text>
      </View>
    </ScrollView>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({
  value,
  icon,
  onPress,
}: PickerFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerField,
        pressed && styles.pickerFieldPressed,
      ]}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons
        name="calendar-outline"
        size={18}
        color={COLORS.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 7,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 15,
  },
  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  pickerField: {
    backgroundColor: COLORS.background,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerFieldPressed: {
    opacity: 0.75,
  },
  pickerValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginTop: 18,
  },
  successBox: {
    backgroundColor: 'rgba(36, 138, 88, 0.10)',
  },
  errorBox: {
    backgroundColor: 'rgba(214, 69, 69, 0.10)',
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 18,
  },
  successText: {
    color: '#248A58',
  },
  errorText: {
    color: '#D64545',
  },
  buttonContainer: {
    marginTop: 22,
  },
  savingIndicator: {
    marginTop: 10,
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    padding: 13,
    marginTop: 5,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pickerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 16,
    alignItems: 'center',
  },
  pickerHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  pickerHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 8,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginTop: 12,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'stretch',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 11,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resultSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  eventSummary: {
    backgroundColor: COLORS.background,
    borderRadius: 13,
    padding: 14,
    marginBottom: 18,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 8,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  qrInstruction: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  anotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  anotherButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  payloadLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 6,
  },
  payloadText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  loadingText: {
    marginTop: 13,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  lockTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 18,
  },
  lockSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 9,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 23,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
