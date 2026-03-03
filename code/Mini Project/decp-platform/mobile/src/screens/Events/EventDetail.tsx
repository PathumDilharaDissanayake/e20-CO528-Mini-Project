import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import {
  Button,
  Text,
  useTheme,
  Appbar,
  Chip,
  Divider,
  ActivityIndicator,
  Avatar,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchEventById,
  clearCurrentEvent,
  attendEvent,
  cancelAttendance,
  deleteEvent,
} from '../../features/eventsSlice';
import { RootScreenProps } from '../../navigation/types';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { EVENT_TYPES } from '../../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'EventDetail'>;

const EventDetail: React.FC<Props> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { currentEvent: event, isLoading } = useAppSelector((state) => state.events);
  const { user } = useAppSelector((state) => state.auth);

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchEventById(eventId));

    return () => {
      dispatch(clearCurrentEvent());
    };
  }, [eventId]);

  const handleAttend = async () => {
    if (!event) return;

    if (event.isAttending) {
      await dispatch(cancelAttendance(eventId));
    } else {
      await dispatch(attendEvent(eventId));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dispatch(deleteEvent(eventId));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const isOwner = event?.organizer.id === user?.id;
  const isFull = event?.maxAttendees && event.attendees.length >= event.maxAttendees && !event.isAttending;

  if (isLoading || !event) {
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
        <Appbar.Content title="Event Details" />
        {isOwner && (
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
                navigation.navigate('CreateEvent');
              }}
              title="Edit"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setShowMenu(false);
                handleDelete();
              }}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        )}
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {event.banner ? (
          <Image source={{ uri: event.banner }} style={styles.banner} />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="calendar" size={64} color="white" />
          </View>
        )}

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Chip>
              {EVENT_TYPES.find((t) => t.value === event.type)?.label}
            </Chip>
          </View>

          <Text variant="headlineSmall" style={styles.eventTitle}>
            {event.title}
          </Text>

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeItem}>
              <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary} />
              <View style={styles.dateTimeText}>
                <Text variant="titleSmall">Start</Text>
                <Text variant="bodyMedium">{formatDateTime(event.startDate)}</Text>
              </View>
            </View>
            <View style={styles.dateTimeItem}>
              <MaterialCommunityIcons name="calendar-end" size={24} color={theme.colors.primary} />
              <View style={styles.dateTimeText}>
                <Text variant="titleSmall">End</Text>
                <Text variant="bodyMedium">{formatDateTime(event.endDate)}</Text>
              </View>
            </View>
          </View>

          <Divider />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {event.description}
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location
            </Text>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons
                name={event.location.type === 'virtual' ? 'video' : 'map-marker'}
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.locationText}>
                <Text variant="bodyMedium">
                  {event.location.type === 'virtual' ? 'Virtual Event' : event.location.address}
                </Text>
                {event.location.link && (
                  <Button
                    mode="text"
                    onPress={() => handleOpenLink(event.location.link!)}
                    icon="open-in-new"
                  >
                    Join Link
                  </Button>
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Organizer
            </Text>
            <View style={styles.organizerInfo}>
              <Avatar.Image size={48} source={{ uri: event.organizer.avatar }} />
              <View style={styles.organizerText}>
                <Text variant="bodyMedium" style={styles.organizerName}>
                  {event.organizer.firstName} {event.organizer.lastName}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                  {event.organizer.jobTitle || event.organizer.department}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Attendees ({event.attendees.length}
              {event.maxAttendees && ` / ${event.maxAttendees}`})
            </Text>
            <View style={styles.attendeesPreview}>
              {event.attendees.slice(0, 5).map((attendeeId, index) => (
                <Avatar.Image
                  key={index}
                  size={40}
                  source={{ uri: `https://i.pravatar.cc/150?u=${attendeeId}` }}
                  style={styles.attendeeAvatar}
                />
              ))}
              {event.attendees.length > 5 && (
                <View style={[styles.moreAttendees, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.moreAttendeesText}>+{event.attendees.length - 5}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        {!isOwner && (
          <Button
            mode={event.isAttending ? 'outlined' : 'contained'}
            onPress={handleAttend}
            style={styles.attendButton}
            icon={event.isAttending ? 'check' : 'calendar-plus'}
            disabled={isFull}
          >
            {event.isAttending ? 'Cancel Attendance' : isFull ? 'Event Full' : 'Attend Event'}
          </Button>
        )}
        {isOwner && (
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: View attendees list
            }}
            style={styles.attendButton}
          >
            Manage Attendees
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  banner: {
    width: '100%',
    height: 200,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateTimeSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: 12,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerText: {
    marginLeft: 12,
  },
  organizerName: {
    fontWeight: '600',
  },
  attendeesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatar: {
    marginRight: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  moreAttendees: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  moreAttendeesText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attendButton: {
    paddingVertical: 8,
  },
});

export default EventDetail;
