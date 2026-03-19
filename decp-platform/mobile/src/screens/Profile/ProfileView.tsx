import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  Text,
  useTheme,
  Appbar,
  IconButton,
  Avatar,
  Chip,
  Divider,
  ActivityIndicator,
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProfile,
  fetchConnections,
  sendConnectionRequest,
  removeConnection,
  clearProfile,
} from '../../features/profileSlice';
import { logout } from '../../features/authSlice';
import { RootScreenProps } from '../../navigation/types';
import { formatDate } from '../../utils/helpers';

type Props = RootScreenProps<'Profile'>;

const ProfileView: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { profile, connections, isLoading } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = route.params?.userId || user?.id;
  const isOwnProfile = userId === user?.id;

  useEffect(() => {
    loadProfile();

    return () => {
      dispatch(clearProfile());
    };
  }, [userId]);

  const loadProfile = async () => {
    await dispatch(fetchProfile(userId));
    if (profile) {
      dispatch(fetchConnections(userId));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleConnect = async () => {
    if (!profile) return;

    if (profile.isConnected) {
      // Show disconnect confirmation
    } else if (profile.hasPendingRequest) {
      // Already sent request
    } else {
      await dispatch(sendConnectionRequest(profile.id));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isOwnProfile ? 'My Profile' : 'Profile'} />
        {isOwnProfile && (
          <Menu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={
              <Appbar.Action icon="dots-vertical" onPress={() => setShowMenu(true)} />
            }
          >
            <Menu.Item
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('EditProfile');
              }}
              title="Edit Profile"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('Connections', { userId: profile.id, type: 'requests' });
              }}
              title="Connection Requests"
              leadingIcon="account-plus"
            />
            <Divider />
            <Menu.Item
              onPress={handleLogout}
              title="Logout"
              leadingIcon="logout"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        )}
      </Appbar.Header>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cover Image */}
        <View style={[styles.coverImage, { backgroundColor: theme.colors.primary }]} />

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Avatar.Image size={120} source={{ uri: profile.avatar }} />
            ) : (
              <Avatar.Text
                size={120}
                label={`${profile.firstName[0]}${profile.lastName[0]}`}
              />
            )}
          </View>

          <Text variant="headlineSmall" style={styles.name}>
            {profile.firstName} {profile.lastName}
          </Text>

          {profile.jobTitle && (
            <Text variant="bodyLarge" style={styles.headline}>
              {profile.jobTitle}
              {profile.company && ` at ${profile.company}`}
            </Text>
          )}

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.location}>
              {profile.location || profile.department}
            </Text>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <Button
                mode={profile.isConnected ? 'outlined' : 'contained'}
                onPress={handleConnect}
                style={styles.connectButton}
                icon={profile.isConnected ? 'account-check' : 'account-plus'}
              >
                {profile.isConnected ? 'Connected' : profile.hasPendingRequest ? 'Pending' : 'Connect'}
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Chat', { conversationId: profile.id })}
                style={styles.messageButton}
                icon="message"
              >
                Message
              </Button>
            </View>
          )}

          {isOwnProfile && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.editButton}
              icon="pencil"
            >
              Edit Profile
            </Button>
          )}
        </View>

        <Divider />

        {/* Stats */}
        <View style={styles.statsSection}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('Connections', { userId: profile.id, type: 'connections' })
            }
          >
            <Text variant="titleLarge" style={styles.statNumber}>
              {profile.connectionsCount}
            </Text>
            <Text variant="bodySmall">Connections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('UserPosts', { userId: profile.id })}
          >
            <Text variant="titleLarge" style={styles.statNumber}>
              {profile.postsCount}
            </Text>
            <Text variant="bodySmall">Posts</Text>
          </TouchableOpacity>
        </View>

        <Divider />

        {/* About */}
        {profile.bio && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyMedium" style={styles.bio}>
              {profile.bio}
            </Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Details
          </Text>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="school" size={20} color={theme.colors.primary} />
            <View style={styles.detailText}>
              <Text variant="bodyMedium">{profile.department}</Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                Department
              </Text>
            </View>
          </View>

          {profile.graduationYear && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <View style={styles.detailText}>
                <Text variant="bodyMedium">Class of {profile.graduationYear}</Text>
                <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                  Graduation Year
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-badge" size={20} color={theme.colors.primary} />
            <View style={styles.detailText}>
              <Text variant="bodyMedium" style={{ textTransform: 'capitalize' }}>
                {profile.role}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                Member Type
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
            <View style={styles.detailText}>
              <Text variant="bodyMedium">Joined {formatDate(profile.createdAt, 'MMMM yyyy')}</Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                Member Since
              </Text>
            </View>
          </View>
        </View>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <>
            <Divider />
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Skills
              </Text>
              <View style={styles.skillsContainer}>
                {profile.skills.map((skill, index) => (
                  <Chip key={index} style={styles.skillChip}>
                    {skill}
                  </Chip>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

import { useState } from 'react';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    height: 120,
  },
  profileSection: {
    padding: 16,
    paddingTop: 0,
  },
  avatarContainer: {
    marginTop: -60,
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headline: {
    opacity: 0.8,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    marginLeft: 4,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  connectButton: {
    flex: 1,
  },
  messageButton: {
    flex: 1,
  },
  editButton: {
    width: '100%',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bio: {
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default ProfileView;
