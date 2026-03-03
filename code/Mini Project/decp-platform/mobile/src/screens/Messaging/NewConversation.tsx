import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Appbar, useTheme, Text, Searchbar, ActivityIndicator, Avatar } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { createConversation } from '../../features/messagesSlice';
import { RootScreenProps } from '../../navigation/types';
import { User } from '../../types';
import { profileService } from '../../services/profileService';

type Props = RootScreenProps<'NewConversation'>;

const NewConversation: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.messages);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const response = await profileService.searchUsers(searchQuery, { page: 1, limit: 20 });
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    try {
      const conversation = await dispatch(createConversation([user.id])).unwrap();
      navigation.replace('Chat', { conversationId: conversation.id, participantName: `${user.firstName} ${user.lastName}` });
    } catch (error) {}
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={[styles.userItem, { backgroundColor: theme.colors.surface }]} onPress={() => handleSelectUser(item)}>
      <Avatar.Image size={48} source={{ uri: item.avatar }} />
      <View style={styles.userInfo}>
        <Text variant="titleSmall" style={styles.userName}>{item.firstName} {item.lastName}</Text>
        <Text variant="bodySmall" style={{ opacity: 0.6 }}>{item.department}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Message" />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar placeholder="Search users..." onChangeText={setSearchQuery} value={searchQuery} loading={isSearching} style={styles.searchBar} />
      </View>

      {isSearching ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text variant="bodyMedium" style={{ opacity: 0.6 }}>No users found</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text variant="bodyMedium" style={{ opacity: 0.6 }}>Type at least 2 characters to search</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { padding: 12 },
  searchBar: { borderRadius: 8 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 },
  userInfo: { marginLeft: 12, flex: 1 },
  userName: { fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
});

export default NewConversation;
