import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Appbar,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useAppDispatch, useAppSelector } from '../../store';
import { applyToJob } from '../../features/jobsSlice';
import { RootScreenProps } from '../../navigation/types';

type Props = RootScreenProps<'ApplyJob'>;

const ApplyJob: React.FC<Props> = ({ route, navigation }) => {
  const { jobId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { currentJob, isLoading } = useAppSelector((state) => state.jobs);

  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string>('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setResume(result.assets[0].uri);
        setResumeName(result.assets[0].name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleSubmit = async () => {
    if (!coverLetter.trim()) return;

    try {
      await dispatch(
        applyToJob({
          jobId,
          application: {
            coverLetter: coverLetter.trim(),
            resume: resume || undefined,
          },
        })
      ).unwrap();
      navigation.goBack();
    } catch (error) {
      // Error handled by slice
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Apply for Job" />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.jobInfo}>
          <Text variant="titleMedium" style={styles.jobTitle}>
            {currentJob?.title}
          </Text>
          <Text variant="bodyMedium" style={styles.companyName}>
            {currentJob?.company}
          </Text>
        </View>

        <View style={styles.form}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Cover Letter *
          </Text>
          <TextInput
            placeholder="Tell us why you're a great fit for this position..."
            value={coverLetter}
            onChangeText={setCoverLetter}
            multiline
            numberOfLines={10}
            mode="outlined"
            style={styles.coverLetterInput}
            textAlignVertical="top"
            maxLength={2000}
          />
          <HelperText type="info">{coverLetter.length}/2000 characters</HelperText>

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Resume (Optional)
          </Text>
          <Button
            mode="outlined"
            onPress={pickDocument}
            icon="file-upload"
            style={styles.uploadButton}
          >
            {resume ? 'Change Resume' : 'Upload Resume (PDF)'}
          </Button>
          {resume && (
            <View style={styles.fileInfo}>
              <Text variant="bodySmall" numberOfLines={1}>
                Selected: {resumeName}
              </Text>
            </View>
          )}
          <HelperText type="info">
            Upload your resume in PDF format (max 5MB)
          </HelperText>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={!coverLetter.trim() || isLoading}
          loading={isLoading}
        >
          Submit Application
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
  jobInfo: {
    marginBottom: 24,
  },
  jobTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    opacity: 0.7,
  },
  form: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  coverLetterInput: {
    minHeight: 200,
  },
  uploadButton: {
    marginBottom: 8,
  },
  fileInfo: {
    padding: 12,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderRadius: 8,
  },
  submitButton: {
    paddingVertical: 8,
    marginBottom: 32,
  },
});

export default ApplyJob;
