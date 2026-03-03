import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  IconButton,
  Text,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store';
import { createPost } from '../../features/feedSlice';
import { RootScreenProps } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = RootScreenProps<'CreatePost'>;

const CreatePost: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.feed);
  const { user } = useAppSelector((state) => state.auth);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const pickImage = async (useCamera: boolean = false) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        `Please grant ${useCamera ? 'camera' : 'photo library'} permissions to upload images.`
      );
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: 5,
        });

    if (!result.canceled) {
      if (media.length + result.assets.length > 5) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 images per post.');
        return;
      }
      setMedia([...media, ...result.assets]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('Empty Post', 'Please add some text or images to your post.');
      return;
    }

    try {
      await dispatch(
        createPost({
          content: content.trim(),
          media: media.map((m) => ({
            uri: m.uri,
            type: 'image/jpeg',
            name: m.fileName || 'image.jpg',
          })),
        })
      ).unwrap();
      navigation.goBack();
    } catch (error) {
      // Error handled by slice
    }
  };

  const canSubmit = content.trim().length > 0 || media.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create Post" />
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!canSubmit || isLoading}
          loading={isLoading}
          style={styles.postButton}
        >
          Post
        </Button>
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.userInfo}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </View>
          )}
          <View style={styles.userText}>
            <Text variant="titleMedium" style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text variant="bodySmall" style={styles.visibility}>
              Public
            </Text>
          </View>
        </View>

        <TextInput
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          textAlignVertical="top"
          maxLength={2000}
        />

        {media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Text variant="bodySmall" style={styles.mediaLabel}>
              {media.length}/5 images
            </Text>
            <View style={styles.mediaGrid}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                  <IconButton
                    icon="close-circle"
                    size={24}
                    iconColor="white"
                    style={styles.removeMedia}
                    onPress={() => removeMedia(index)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => pickImage(false)}
          disabled={media.length >= 5 || isLoading}
        >
          <MaterialCommunityIcons
            name="image"
            size={24}
            color={media.length >= 5 ? theme.colors.disabled : theme.colors.primary}
          />
          <Text
            variant="bodySmall"
            style={{ color: media.length >= 5 ? theme.colors.disabled : theme.colors.primary }}
          >
            Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => pickImage(true)}
          disabled={media.length >= 5 || isLoading}
        >
          <MaterialCommunityIcons
            name="camera"
            size={24}
            color={media.length >= 5 ? theme.colors.disabled : theme.colors.primary}
          />
          <Text
            variant="bodySmall"
            style={{ color: media.length >= 5 ? theme.colors.disabled : theme.colors.primary }}
          >
            Camera
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  postButton: {
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userText: {
    marginLeft: 12,
  },
  userName: {
    fontWeight: '600',
  },
  visibility: {
    opacity: 0.6,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    minHeight: 150,
  },
  mediaContainer: {
    marginTop: 16,
  },
  mediaLabel: {
    marginBottom: 8,
    opacity: 0.6,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 4,
  },
});

export default CreatePost;
