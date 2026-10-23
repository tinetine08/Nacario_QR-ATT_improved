
import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import {
  getProfile,
  type Profile,
  updateProfile,
} from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load the current user's profile
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    try {
      const result = await getProfile(user.id);

      setProfile(result);
      setDraftName(result?.full_name ?? '');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load your profile.';

      Alert.alert('Profile Error', message);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // Save the updated full name
  const handleSaveName = async () => {
    if (!user || saving) return;

    const trimmedName = draftName.trim();

    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return;
    }

    if (trimmedName.length > 100) {
      Alert.alert('Invalid Name', 'Your name must be 100 characters or fewer.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateProfile(user.id, {
        full_name: trimmedName,
      });

      if (error) {
        Alert.alert('Update Failed', error);
        return;
      }

      setProfile((previous) =>
        previous
          ? { ...previous, full_name: trimmedName }
          : previous
      );

      setDraftName(trimmedName);
      setEditing(false);

      Alert.alert('Success', 'Your full name has been updated.');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update your name.';

      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing and restore the saved name
  const handleCancelEdit = () => {
    setDraftName(profile?.full_name ?? '');
    setEditing(false);
  };

  // Sign out with confirmation
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            if (loading) return;

            setLoading(true);

            try {
              await signOut();
              router.replace('/login');
            } catch (error: unknown) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Failed to sign out.';

              Alert.alert('Sign Out Failed', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const fullName = profile?.full_name || 'User';
  const isTeacher = profile?.role === 'teacher';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>ACCOUNT</Text>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>
              Manage your personal information
            </Text>
          </View>

          <View style={styles.headingIcon}>
            <Ionicons
              name="person-outline"
              size={25}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials || 'U'}
            </Text>
          </View>

          <Text style={styles.profileName}>{fullName}</Text>

          <View
            style={[
              styles.roleBadge,
              isTeacher ? styles.teacherBadge : styles.studentBadge,
            ]}
          >
            <Ionicons
              name={isTeacher ? 'school-outline' : 'book-outline'}
              size={15}
              color={isTeacher ? '#2563EB' : '#15803D'}
            />
            <Text
              style={[
                styles.roleText,
                isTeacher ? styles.teacherText : styles.studentText,
              ]}
            >
              {isTeacher ? 'Teacher' : 'Student'}
            </Text>
          </View>

          <Text style={styles.profileCaption}>
            QR Attendance Account
          </Text>
        </View>

        {/* Personal information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {!editing && (
            <Pressable
              style={styles.editButton}
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit full name"
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={COLORS.primary}
              />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.infoCard}>
          {/* Full name */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>Full Name</Text>

              {editing ? (
                <TextInput
                  style={styles.nameInput}
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={100}
                  editable={!saving}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
              ) : (
                <Text style={styles.value}>{fullName}</Text>
              )}
            </View>
          </View>

          {editing && (
            <View style={styles.editActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSaveName}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.saveText}>Save Changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          <View style={styles.separator} />

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>
                {profile?.email || user?.email || 'Not available'}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* User ID */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="finger-print-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.valueSmall} selectable>
                {profile?.id || user?.id || 'Not available'}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Account role */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>Account Role</Text>
              <Text style={styles.value}>
                {profile?.role
                  ? profile.role.charAt(0).toUpperCase() +
                    profile.role.slice(1)
                  : 'Not assigned'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account actions */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <Pressable
          style={styles.settingsCard}
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
        >
          <View style={styles.settingsIcon}>
            <Ionicons name="options-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>App Settings</Text>
            <Text style={styles.settingsDescription}>Preferences, privacy and app information</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </Pressable>

        <View style={styles.settingsCard}>
          <View style={styles.settingsIcon}>
            <Ionicons
              name="log-out-outline"
              size={22}
              color="#DC2626"
            />
          </View>

          <View style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>Sign Out</Text>
            <Text style={styles.settingsDescription}>
              Sign out of your current account
            </Text>
          </View>
        </View>

        <View style={styles.signOutButton}>
          <AppButton
            title={loading ? 'Signing Out...' : 'Sign Out'}
            icon="log-out-outline"
            onPress={handleSignOut}
          />
        </View>

        <Text style={styles.footer}>
          QR Attendance {'\u2022'} Account Profile
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 36,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: COLORS.background,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
  },

  profileName: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 12,
  },

  teacherBadge: {
    backgroundColor: '#DBEAFE',
  },

  studentBadge: {
    backgroundColor: '#DCFCE7',
  },

  roleText: {
    fontSize: 12,
    fontWeight: '800',
  },

  teacherText: {
    color: '#2563EB',
  },

  studentText: {
    color: '#15803D',
  },

  profileCaption: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
  },

  editButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 13,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },

  value: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  valueSmall: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  nameInput: {
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 2,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 55,
  },

  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingBottom: 14,
    paddingTop: 5,
  },

  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },

  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    minWidth: 125,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.6,
  },

  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  settingsContent: {
    flex: 1,
  },

  settingsTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },

  settingsDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  signOutButton: {
    marginBottom: 18,
  },

  footer: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 11,
    marginTop: 4,
  },
});
