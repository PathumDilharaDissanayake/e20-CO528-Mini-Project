import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Appbar,
  Avatar,
  Chip,
  IconButton,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateProfileData, uploadAvatar } from '../../features/profileSlice';
import { updateUserField } from '../../features/authSlice';
import { RootScreenProps } from '../../navigation/types';
import { DEPARTMENTS } from '../../utils/constants';

type Props = RootScreenProps<'EditProfile'>;

const EditProfile: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    department: user?.department || '',
    graduationYear: user?.graduationYear?.toString() || '',
  });

  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      setIsUploading(true);
      try {
        const response = await dispatch(uploadAvatar(uri)).unwrap();
        dispatch(updateUserField({ avatar: response.avatar }));
      } catch (error) {
        Alert.alert('Error', 'Failed to upload avatar');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSave = async () => {
    try {
      const updateData = {
        ...formData,
        skills,
        graduationYear: formData.graduationYear
          ? parseInt(formData.graduationYear)
          : undefined,
      };

      await dispatch(updateProfileData(updateData)).unwrap();
      dispatch(updateUserField(updateData));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Profile" />
        <Appbar.Action icon="check" onPress={handleSave} disabled={isLoading} />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploading}>
            {avatarUri ? (
              <Avatar.Image size={100} source={{ uri: avatarUri }} />
            ) : (
              <Avatar.Text
                size={100}
                label={`${formData.firstName[0]}${formData.lastName[0]}`}
              />
            )}
            {isUploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
            <View style={styles.editIcon}>
              <IconButton icon="camera" size={16} iconColor="white" />
            </View>
          </TouchableOpacity>
          <Button mode="text" onPress={handlePickImage} disabled={isUploading}>
            Change Photo
          </Button>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Basic Information
          </Text>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                mode="outlined"
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.flex1}>
              <TextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                mode="outlined"
              />
            </View>
          </View>

          <TextInput
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />
          <HelperText type="info">Tell others about yourself</HelperText>

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Work Information
          </Text>

          <TextInput
            label="Job Title"
            value={formData.jobTitle}
            onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
            mode="outlined"
            left={<TextInput.Icon icon="briefcase" />}
          />

          <TextInput
            label="Company"
            value={formData.company}
            onChangeText={(text) => setFormData({ ...formData, company: text })}
            mode="outlined"
            left={<TextInput.Icon icon="office-building" />}
          />

          <TextInput
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            mode="outlined"
            left={<TextInput.Icon icon="map-marker" />}
          />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Education
          </Text>

          <TextInput
            label="Department"
            value={formData.department}
            onChangeText={(text) => setFormData({ ...formData, department: text })}
            mode="outlined"
            left={<TextInput.Icon icon="school" />}
          />

          <TextInput
            label="Graduation Year"
            value={formData.graduationYear}
            onChangeText={(text) => setFormData({ ...formData, graduationYear: text })}
            mode="outlined"
            keyboardType="numeric"
            maxLength={4}
            left={<TextInput.Icon icon="calendar" />}
          />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Skills
          </Text>

          <View style={styles.skillsInputRow}>
            <TextInput
              label="Add Skill"
              value={newSkill}
              onChangeText={setNewSkill}
              mode="outlined"
              style={styles.skillInput}
              onSubmitEditing={handleAddSkill}
            />
            <IconButton icon="plus" onPress={handleAddSkill} disabled={!newSkill.trim()} />
          </View>

          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveSkill(skill)}
                style={styles.skillChip}
              >
                {skill}
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 20,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#6200ee',
    borderRadius: 15,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  bioInput: {
    minHeight: 100,
  },
  skillsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skillChip: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});

export default EditProfile;
