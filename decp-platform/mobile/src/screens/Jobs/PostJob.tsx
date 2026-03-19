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
  Chip,
  Menu,
  Divider,
  Switch,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { createJob } from '../../features/jobsSlice';
import { RootScreenProps } from '../../navigation/types';
import { JOB_TYPES } from '../../utils/constants';

type Props = RootScreenProps<'PostJob'>;

const PostJob: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.jobs);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: '' as typeof JOB_TYPES[0]['value'] | '',
    description: '',
    requirements: '',
    responsibilities: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    skills: [] as string[],
    hasDeadline: false,
    deadline: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      updateField('skills', [...formData.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateField(
      'skills',
      formData.skills.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleSubmit = async () => {
    try {
      const jobData = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        type: formData.type,
        description: formData.description.trim(),
        requirements: formData.requirements.split('\n').filter((r) => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter((r) => r.trim()),
        skills: formData.skills,
        salary:
          formData.salaryMin && formData.salaryMax
            ? {
                min: parseInt(formData.salaryMin),
                max: parseInt(formData.salaryMax),
                currency: formData.currency,
              }
            : undefined,
        deadline: formData.hasDeadline ? formData.deadline : undefined,
      };

      await dispatch(createJob(jobData)).unwrap();
      navigation.goBack();
    } catch (error) {
      // Error handled by slice
    }
  };

  const isValid =
    formData.title.trim() &&
    formData.company.trim() &&
    formData.location.trim() &&
    formData.type &&
    formData.description.trim();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Post a Job" />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Job Information
        </Text>

        <TextInput
          label="Job Title *"
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          mode="outlined"
        />

        <TextInput
          label="Company *"
          value={formData.company}
          onChangeText={(text) => updateField('company', text)}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Location *"
          value={formData.location}
          onChangeText={(text) => updateField('location', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="map-marker" />}
        />

        <Menu
          visible={showTypeMenu}
          onDismiss={() => setShowTypeMenu(false)}
          anchor={
            <TextInput
              label="Job Type *"
              value={JOB_TYPES.find((t) => t.value === formData.type)?.label || ''}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="menu-down" onPress={() => setShowTypeMenu(true)} />}
              onPressIn={() => setShowTypeMenu(true)}
            />
          }
        >
          {JOB_TYPES.map((type) => (
            <Menu.Item
              key={type.value}
              onPress={() => {
                updateField('type', type.value);
                setShowTypeMenu(false);
              }}
              title={type.label}
            />
          ))}
        </Menu>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Job Description *
        </Text>
        <TextInput
          placeholder="Describe the role, responsibilities, and what you're looking for..."
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={6}
          mode="outlined"
          style={styles.textArea}
          textAlignVertical="top"
        />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Requirements
        </Text>
        <TextInput
          placeholder="List requirements (one per line)..."
          value={formData.requirements}
          onChangeText={(text) => updateField('requirements', text)}
          multiline
          numberOfLines={4}
          mode="outlined"
          style={styles.textArea}
          textAlignVertical="top"
        />
        <HelperText type="info">Enter each requirement on a new line</HelperText>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Responsibilities
        </Text>
        <TextInput
          placeholder="List responsibilities (one per line)..."
          value={formData.responsibilities}
          onChangeText={(text) => updateField('responsibilities', text)}
          multiline
          numberOfLines={4}
          mode="outlined"
          style={styles.textArea}
          textAlignVertical="top"
        />
        <HelperText type="info">Enter each responsibility on a new line</HelperText>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Skills Required
        </Text>
        <View style={styles.skillsInputRow}>
          <TextInput
            label="Add Skill"
            value={newSkill}
            onChangeText={setNewSkill}
            mode="outlined"
            style={styles.skillInput}
            onSubmitEditing={addSkill}
          />
          <Button mode="contained" onPress={addSkill} disabled={!newSkill.trim()}>
            Add
          </Button>
        </View>
        <View style={styles.skillsContainer}>
          {formData.skills.map((skill, index) => (
            <Chip key={index} onClose={() => removeSkill(skill)} style={styles.skillChip}>
              {skill}
            </Chip>
          ))}
        </View>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Salary (Optional)
        </Text>
        <View style={styles.salaryRow}>
          <TextInput
            label="Min"
            value={formData.salaryMin}
            onChangeText={(text) => updateField('salaryMin', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.salaryInput}
            left={<TextInput.Affix text="$" />}
          />
          <Text style={styles.salarySeparator}>-</Text>
          <TextInput
            label="Max"
            value={formData.salaryMax}
            onChangeText={(text) => updateField('salaryMax', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.salaryInput}
            left={<TextInput.Affix text="$" />}
          />
        </View>

        <View style={styles.deadlineRow}>
          <Text variant="bodyMedium">Set Application Deadline</Text>
          <Switch
            value={formData.hasDeadline}
            onValueChange={(value) => updateField('hasDeadline', value)}
          />
        </View>

        {formData.hasDeadline && (
          <TextInput
            label="Deadline"
            value={formData.deadline}
            onChangeText={(text) => updateField('deadline', text)}
            mode="outlined"
            placeholder="YYYY-MM-DD"
          />
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          Post Job
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
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    marginTop: 8,
  },
  textArea: {
    minHeight: 120,
  },
  skillsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 4,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salaryInput: {
    flex: 1,
  },
  salarySeparator: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 8,
  },
});

export default PostJob;
