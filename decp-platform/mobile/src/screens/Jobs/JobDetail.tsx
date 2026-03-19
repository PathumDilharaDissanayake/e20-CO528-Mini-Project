import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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
  fetchJobById,
  clearCurrentJob,
  applyToJob,
  deleteJob,
} from '../../features/jobsSlice';
import { RootScreenProps } from '../../navigation/types';
import { formatDate } from '../../utils/helpers';
import { JOB_TYPES } from '../../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'JobDetail'>;

const JobDetail: React.FC<Props> = ({ route, navigation }) => {
  const { jobId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { currentJob: job, isLoading } = useAppSelector((state) => state.jobs);
  const { user } = useAppSelector((state) => state.auth);

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchJobById(jobId));

    return () => {
      dispatch(clearCurrentJob());
    };
  }, [jobId]);

  const handleApply = () => {
    navigation.navigate('ApplyJob', { jobId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dispatch(deleteJob(jobId));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const isOwner = job?.postedBy.id === user?.id;
  const canApply = !isOwner && user?.role === 'student' && !job?.hasApplied;

  if (isLoading || !job) {
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
        <Appbar.Content title="Job Details" />
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
                navigation.navigate('PostJob');
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
        <View style={styles.header}>
          <View style={styles.jobIconContainer}>
            <MaterialCommunityIcons name="briefcase" size={40} color={theme.colors.primary} />
          </View>
          <Text variant="headlineSmall" style={styles.jobTitle}>
            {job.title}
          </Text>
          <Text variant="titleMedium" style={styles.companyName}>
            {job.company}
          </Text>
        </View>

        <View style={styles.quickInfo}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium">{job.location}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium">
              {JOB_TYPES.find((t) => t.value === job.type)?.label}
            </Text>
          </View>
          {job.salary && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="currency-usd" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium">
                {job.salary.currency} {job.salary.min.toLocaleString()} -{' '}
                {job.salary.max.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <Divider />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {job.description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Requirements
          </Text>
          {job.requirements.map((req, index) => (
            <View key={index} style={styles.listItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.listItemText}>
                {req}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Responsibilities
          </Text>
          {job.responsibilities.map((resp, index) => (
            <View key={index} style={styles.listItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.listItemText}>
                {resp}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Skills Required
          </Text>
          <View style={styles.skillsContainer}>
            {job.skills.map((skill, index) => (
              <Chip key={index} style={styles.skillChip}>
                {skill}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Posted By
          </Text>
          <View style={styles.posterInfo}>
            <Avatar.Image size={40} source={{ uri: job.postedBy.avatar }} />
            <View style={styles.posterText}>
              <Text variant="bodyMedium" style={styles.posterName}>
                {job.postedBy.firstName} {job.postedBy.lastName}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                {formatDate(job.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {job.deadline && (
          <View style={styles.section}>
            <Text variant="bodySmall" style={styles.deadlineText}>
              Application Deadline: {formatDate(job.deadline)}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {canApply ? (
            <Button
              mode="contained"
              onPress={handleApply}
              style={styles.applyButton}
              icon="send"
            >
              Apply Now
            </Button>
          ) : job.hasApplied ? (
            <Button mode="outlined" disabled style={styles.applyButton}>
              Already Applied
            </Button>
          ) : isOwner ? (
            <Button
              mode="outlined"
              onPress={() => {
                // TODO: View applicants
              }}
              style={styles.applyButton}
            >
              View Applicants ({job.applicants.length})
            </Button>
          ) : null}
        </View>
      </ScrollView>
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
  header: {
    alignItems: 'center',
    padding: 24,
  },
  jobIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  companyName: {
    opacity: 0.8,
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listItemText: {
    marginLeft: 8,
    flex: 1,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    marginBottom: 4,
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterText: {
    marginLeft: 12,
  },
  posterName: {
    fontWeight: '600',
  },
  deadlineText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  applyButton: {
    paddingVertical: 8,
  },
});

export default JobDetail;
