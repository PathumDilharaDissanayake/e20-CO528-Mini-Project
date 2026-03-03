import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button, Text, useTheme, Appbar, Chip, Divider, ActivityIndicator, Avatar, Menu,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProjectById, clearCurrentProject, joinProject, leaveProject, deleteProject } from '../../features/researchSlice';
import { RootScreenProps } from '../../navigation/types';
import { formatDate } from '../../utils/helpers';

type Props = RootScreenProps<'ProjectDetail'>;

const ProjectDetail: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { currentProject: project, isLoading } = useAppSelector((state) => state.research);
  const { user } = useAppSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectById(projectId));
    return () => { dispatch(clearCurrentProject()); };
  }, [projectId]);

  const handleJoin = async () => {
    if (project?.isCollaborator) {
      await dispatch(leaveProject(projectId));
    } else {
      await dispatch(joinProject(projectId));
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await dispatch(deleteProject(projectId));
        navigation.goBack();
      }},
    ]);
  };

  if (isLoading || !project) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header><Appbar.BackAction onPress={() => navigation.goBack()} /></Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const isLead = project.leadResearcher.id === user?.id;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Project Details" />
        {isLead && (
          <Menu visible={showMenu} onDismiss={() => setShowMenu(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setShowMenu(true)} />}>
            <Menu.Item onPress={() => { setShowMenu(false); }} title="Edit" leadingIcon="pencil" />
            <Menu.Item onPress={() => { setShowMenu(false); handleDelete(); }} title="Delete" leadingIcon="delete" titleStyle={{ color: theme.colors.error }} />
          </Menu>
        )}
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>{project.title}</Text>
          <Chip style={[styles.statusChip, { backgroundColor: project.status === 'ongoing' ? '#4caf50' : project.status === 'completed' ? '#2196f3' : '#ff9800' }]} textStyle={{ color: 'white' }}>
            {project.status}
          </Chip>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Abstract</Text>
          <Text variant="bodyMedium">{project.abstract}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
          <Text variant="bodyMedium">{project.description}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Field</Text>
          <Chip>{project.field}</Chip>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Lead Researcher</Text>
          <View style={styles.researcherRow}>
            <Avatar.Image size={40} source={{ uri: project.leadResearcher.avatar }} />
            <View style={styles.researcherInfo}>
              <Text variant="bodyMedium" style={styles.researcherName}>{project.leadResearcher.firstName} {project.leadResearcher.lastName}</Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>{project.leadResearcher.department}</Text>
            </View>
          </View>
        </View>

        {project.collaborators.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Collaborators</Text>
            {project.collaborators.map((collab) => (
              <View key={collab.id} style={styles.researcherRow}>
                <Avatar.Image size={36} source={{ uri: collab.avatar }} />
                <View style={styles.researcherInfo}>
                  <Text variant="bodyMedium">{collab.firstName} {collab.lastName}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {project.funding && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Funding</Text>
            <Text variant="bodyMedium">{project.funding.source}: {project.funding.currency} {project.funding.amount.toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Timeline</Text>
          <Text variant="bodyMedium">Started: {formatDate(project.startDate)}</Text>
          {project.endDate && <Text variant="bodyMedium">Ended: {formatDate(project.endDate)}</Text>}
        </View>
      </ScrollView>

      {!isLead && (
        <View style={styles.footer}>
          <Button mode={project.isCollaborator ? 'outlined' : 'contained'} onPress={handleJoin} style={styles.actionButton}>
            {project.isCollaborator ? 'Leave Project' : 'Join Project'}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  header: { marginBottom: 16 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  statusChip: { alignSelf: 'flex-start' },
  section: { marginBottom: 24 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 12 },
  researcherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  researcherInfo: { marginLeft: 12 },
  researcherName: { fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  actionButton: { paddingVertical: 8 },
});

export default ProjectDetail;
