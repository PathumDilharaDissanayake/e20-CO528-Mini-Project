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
  Chip,
  FAB,
  Card,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProjects,
  fetchMoreProjects,
} from '../../features/researchSlice';
import { RootScreenProps } from '../../navigation/types';
import { ResearchProject } from '../../types';
import { formatDate } from '../../utils/helpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'Research'>;

const ResearchProjects: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { projects, isLoading, isLoadingMore, hasMore, page } = useAppSelector(
    (state) => state.research
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    await dispatch(fetchProjects({ page: 1, limit: 10 })).unwrap();
  };

  const loadMoreProjects = () => {
    if (!isLoadingMore && hasMore) {
      dispatch(fetchMoreProjects({ page: page + 1, limit: 10 }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'proposed':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const renderProject = useCallback(
    ({ item }: { item: ResearchProject }) => (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
      >
        <Card style={styles.projectCard}>
          <Card.Content>
            <View style={styles.projectHeader}>
              <Text variant="titleMedium" style={styles.projectTitle}>
                {item.title}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={{ color: 'white' }}
                compact
              >
                {item.status}
              </Chip>
            </View>

            <Text variant="bodySmall" style={styles.field}>
              {item.field}
            </Text>

            <Text variant="bodyMedium" numberOfLines={2} style={styles.abstract}>
              {item.abstract}
            </Text>

            <View style={styles.projectFooter}>
              <View style={styles.collaborators}>
                <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.primary} />
                <Text variant="bodySmall" style={styles.footerText}>
                  {item.collaborators.length + 1} researchers
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.date}>
                Started {formatDate(item.startDate)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    ),
    [navigation, theme]
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="flask-empty"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodyLarge" style={styles.emptyText}>
          No research projects yet
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Research Projects" />
      </Appbar.Header>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMoreProjects}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateProject')}
        color="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  projectCard: {
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitle: {
    flex: 1,
    fontWeight: '600',
    marginRight: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  field: {
    opacity: 0.7,
    marginBottom: 8,
  },
  abstract: {
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collaborators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 4,
    opacity: 0.7,
  },
  date: {
    opacity: 0.5,
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

export default ResearchProjects;
