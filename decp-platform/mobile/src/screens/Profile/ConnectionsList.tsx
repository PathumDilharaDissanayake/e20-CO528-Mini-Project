import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  Appbar,
  Avatar,
  Button,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchConnections,
  fetchPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
} from '../../features/profileSlice';
import { RootScreenProps } from '../../navigation/types';
import { User } from '../../types';

type Props = RootScreenProps<'Connections'>;

const ConnectionsList: React.FC<Props> = ({ route, navigation }) => {
  const { userId, type } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { connections, pendingRequests, isLoading } = useAppSelector(
    (state) => state.profile
  );
  const { user } = useAppSelector((state) => state.auth);

  const isOwnProfile = userId === user?.id;
  const isRequests = type === 'requests';

  useEffect(() => {
    if (isRequests && isOwnProfile) {
      dispatch(fetchPendingRequests());
    } else {
      dispatch(fetchConnections(userId));
    }
  }, [userId, type]);

  const handleAccept = async (userId: string) => {
    await dispatch(acceptConnectionRequest(userId));
  };

  const handleReject = async (userId: string) => {
    await dispatch(rejectConnectionRequest(userId));
  };

  const handleRemove = async (userId: string) => {
    await dispatch(removeConnection(userId));
  };

  const renderConnection = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    >
      <Avatar.Image size={48} source={{ uri: item.avatar }} />
      <View style={styles.userInfo}>
        <Text variant="titleSmall" style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text variant="bodySmall" style={{ opacity: 0.6 }}>
          {item.jobTitle || item.department}
        </Text>
      </View>
      {isRequests && isOwnProfile ? (
        <View style={styles.requestActions}>
          <Button
            mode="contained"
            onPress={() => handleAccept(item.id)}
            style={styles.actionButton}
            compact
          >
            Accept
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleReject(item.id)}
            style={styles.actionButton}
            compact
          >
            Decline
          </Button>
        </View>
      ) : isOwnProfile ? (
        <IconButton
          icon="close"
          size={20}
          onPress={() => handleRemove(item.id)}
        />
      ) : null}
    </TouchableOpacity>
  );

  const data = isRequests && isOwnProfile ? pendingRequests : connections;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={isRequests ? 'Connection Requests' : 'Connections'} />
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
        <Appbar.Content title={isRequests ? 'Connection Requests' : 'Connections'} />
      </Appbar.Header>

      <FlatList
        data={data}
        renderItem={renderConnection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ opacity: 0.6 }}>
              {isRequests
                ? 'No pending connection requests'
                : 'No connections yet'}
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default ConnectionsList;
