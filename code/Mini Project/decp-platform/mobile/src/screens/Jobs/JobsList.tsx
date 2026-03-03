import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Appbar,
  useTheme,
  Text,
  ActivityIndicator,
  Searchbar,
  Chip,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchJobs,
  fetchMoreJobs,
  clearFilters,
  setFilters,
} from '../../features/jobsSlice';
import { RootScreenProps } from '../../navigation/types';
import { Job } from '../../types';
import { JOB_TYPES } from '../../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'JobsList'>;

const JobsList: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { jobs, isLoading, isLoadingMore, hasMore, page, filters } = useAppSelector(
    (state) => state.jobs
  );
  const { user } = useAppSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    await dispatch(fetchJobs({ page: 1, limit: 10, filters })).unwrap();
  };

  const loadMoreJobs = () => {
    if (!isLoadingMore && hasMore) {
      dispatch(fetchMoreJobs({ page: page + 1, limit: 10, filters }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleSearch = () => {
    dispatch(setFilters({ search: searchQuery }));
  };

  const handleFilterByType = (type: string) => {
    dispatch(setFilters({ type: filters.type === type ? undefined : type }));
    setShowTypeMenu(false);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    dispatch(clearFilters());
  };

  const renderJob = useCallback(
    ({ item }: { item: Job }) => (
      <TouchableOpacity
        style={[styles.jobCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobIconContainer}>
            <MaterialCommunityIcons name="briefcase" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.jobHeaderInfo}>
            <Text variant="titleMedium" style={styles.jobTitle}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={styles.companyName}>
              {item.company}
            </Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.detailText}>
              {item.location}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.detailText}>
              {JOB_TYPES.find((t) => t.value === item.type)?.label || item.type}
            </Text>
          </View>
          {item.salary && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.detailText}>
                {item.salary.currency} {item.salary.min.toLocaleString()} -{' '}
                {item.salary.max.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 3).map((skill, index) => (
              <Chip key={index} style={styles.skillChip} compact>
                {skill}
              </Chip>
            ))}
            {item.skills.length > 3 && (
              <Chip style={styles.skillChip} compact>
                +{item.skills.length - 3}
              </Chip>
            )}
          </View>
          {item.hasApplied && (
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              Applied
            </Text>
          )}
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
          name="briefcase-off"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodyLarge" style={styles.emptyText}>
          No jobs found
        </Text>
        {(filters.search || filters.type) && (
          <Button mode="text" onPress={clearAllFilters}>
            Clear Filters
          </Button>
        )}
      </View>
    );
  };

  const hasActiveFilters = filters.search || filters.type;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Jobs" />
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={<Appbar.Action icon="filter-variant" onPress={() => setShowFilterMenu(true)} />}
        >
          <Menu.Item
            onPress={() => {
              setShowFilterMenu(false);
              setShowTypeMenu(true);
            }}
            title="Filter by Type"
            leadingIcon="filter"
          />
          <Menu.Item
            onPress={() => {
              setShowFilterMenu(false);
              // TODO: Filter by location
            }}
            title="Filter by Location"
            leadingIcon="map-marker"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setShowFilterMenu(false);
              clearAllFilters();
            }}
            title="Clear Filters"
            leadingIcon="filter-remove"
          />
        </Menu>
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFilters}>
          {filters.search && (
            <Chip onClose={() => dispatch(setFilters({ search: undefined }))} style={styles.filterChip}>
              Search: {filters.search}
            </Chip>
          )}
          {filters.type && (
            <Chip onClose={() => dispatch(setFilters({ type: undefined }))} style={styles.filterChip}>
              Type: {JOB_TYPES.find((t) => t.value === filters.type)?.label}
            </Chip>
          )}
        </View>
      )}

      <Menu
        visible={showTypeMenu}
        onDismiss={() => setShowTypeMenu(false)}
        anchor={{ x: 0, y: 0 }}
      >
        {JOB_TYPES.map((type) => (
          <Menu.Item
            key={type.value}
            onPress={() => handleFilterByType(type.value)}
            title={type.label}
            trailingIcon={filters.type === type.value ? 'check' : undefined}
          />
        ))}
      </Menu>

      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMoreJobs}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      {user?.role !== 'student' && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('PostJob')}
          color="white"
        />
      )}
    </View>
  );
};

import { Button } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
  },
  searchBar: {
    borderRadius: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContent: {
    padding: 12,
  },
  jobCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  jobTitle: {
    fontWeight: '600',
  },
  companyName: {
    opacity: 0.7,
    marginTop: 2,
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    marginRight: 4,
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

export default JobsList;
