import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Appbar,
  useTheme,
  Text,
  ActivityIndicator,
  Chip,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchEvents,
  fetchMoreEvents,
} from '../../features/eventsSlice';
import { RootScreenProps } from '../../navigation/types';
import { Event } from '../../types';
import { EVENT_TYPES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'EventsList'>;

const EventsList: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { events, isLoading, isLoadingMore, hasMore, page } = useAppSelector(
    (state) => state.events
  );
  const { user } = useAppSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [filterType]);

  const loadEvents = async () => {
    const filters = filterType ? { type: filterType } : {};
    await dispatch(fetchEvents({ page: 1, limit: 10, filters })).unwrap();
  };

  const loadMoreEvents = () => {
    if (!isLoadingMore && hasMore) {
      const filters = filterType ? { type: filterType } : {};
      dispatch(fetchMoreEvents({ page: page + 1, limit: 10, filters }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleFilterByType = (type: string | null) => {
    setFilterType(type);
    setShowFilterMenu(false);
  };

  const renderEvent = useCallback(
    ({ item }: { item: Event }) => (
      <TouchableOpacity
        style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {item.banner ? (
          <Image source={{ uri: item.banner }} style={styles.banner} />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="calendar" size={48} color="white" />
          </View>
        )}

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Chip compact style={styles.typeChip}>
              {EVENT_TYPES.find((t) => t.value === item.type)?.label || item.type}
            </Chip>
            {item.isAttending && (
              <Chip compact style={styles.attendingChip}>
                Attending
              </Chip>
            )}
          </View>

          <Text variant="titleMedium" style={styles.eventTitle}>
            {item.title}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.detailText}>
                {formatDateTime(item.startDate)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.detailText}>
                {item.location.type === 'virtual' ? 'Virtual Event' : item.location.address}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.detailText}>
                {item.attendees.length} attending
                {item.maxAttendees && ` / ${item.maxAttendees} max`}
              </Text>
            </View>
          </View>

          <Text variant="bodySmall" style={styles.organizer}>
            Organized by {item.organizer.firstName} {item.organizer.lastName}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation, theme]
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="calendar-blank"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodyLarge" style={styles.emptyText}>
          No events found
        </Text>
        {filterType && (
          <Button mode="text" onPress={() => handleFilterByType(null)}>
            Clear Filter
          </Button>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Events" />
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={<Appbar.Action icon="filter-variant" onPress={() => setShowFilterMenu(true)} />}
        >
          <Menu.Item
            onPress={() => handleFilterByType(null)}
            title="All Events"
            trailingIcon={filterType === null ? 'check' : undefined}
          />
          <Divider />
          {EVENT_TYPES.map((type) => (
            <Menu.Item
              key={type.value}
              onPress={() => handleFilterByType(type.value)}
              title={type.label}
              leadingIcon={type.icon}
              trailingIcon={filterType === type.value ? 'check' : undefined}
            />
          ))}
        </Menu>
      </Appbar.Header>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMoreEvents}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateEvent')}
        color="white"
      />
    </View>
  );
};

import { Button } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  eventCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  banner: {
    width: '100%',
    height: 150,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  attendingChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#4caf50',
  },
  eventTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    opacity: 0.8,
  },
  organizer: {
    opacity: 0.6,
  },
  footer: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    opacity: 0.6,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default EventsList;
