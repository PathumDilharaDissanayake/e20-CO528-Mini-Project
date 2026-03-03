import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Appbar, Chip, Menu } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { createProject } from '../../features/researchSlice';
import { RootScreenProps } from '../../navigation/types';
import { RESEARCH_FIELDS } from '../../utils/constants';

type Props = RootScreenProps<'CreateProject'>;

const CreateProject: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.research);

  const [formData, setFormData] = useState({
    title: '', abstract: '', description: '', field: '', tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [showFieldMenu, setShowFieldMenu] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createProject(formData)).unwrap();
      navigation.goBack();
    } catch (error) {}
  };

  const isValid = formData.title.trim() && formData.abstract.trim() && formData.description.trim() && formData.field;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create Project" />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput label="Project Title *" value={formData.title} onChangeText={(text) => updateField('title', text)} mode="outlined" />
        
        <Menu visible={showFieldMenu} onDismiss={() => setShowFieldMenu(false)}
          anchor={<TextInput label="Research Field *" value={formData.field} mode="outlined" editable={false} style={styles.input} right={<TextInput.Icon icon="menu-down" onPress={() => setShowFieldMenu(true)} />} onPressIn={() => setShowFieldMenu(true)} />}>
          {RESEARCH_FIELDS.map((field) => (
            <Menu.Item key={field} onPress={() => { updateField('field', field); setShowFieldMenu(false); }} title={field} />
          ))}
        </Menu>

        <TextInput label="Abstract *" value={formData.abstract} onChangeText={(text) => updateField('abstract', text)} mode="outlined" multiline numberOfLines={4} style={styles.textArea} textAlignVertical="top" />
        
        <TextInput label="Description *" value={formData.description} onChangeText={(text) => updateField('description', text)} mode="outlined" multiline numberOfLines={6} style={styles.textArea} textAlignVertical="top" />

        <View style={styles.tagInputRow}>
          <TextInput label="Add Tag" value={newTag} onChangeText={setNewTag} mode="outlined" style={styles.tagInput} onSubmitEditing={addTag} />
          <Button mode="contained" onPress={addTag} disabled={!newTag.trim()}>Add</Button>
        </View>

        <View style={styles.tagsContainer}>
          {formData.tags.map((tag, index) => <Chip key={index} onClose={() => removeTag(tag)} style={styles.tagChip}>{tag}</Chip>)}
        </View>

        <Button mode="contained" onPress={handleSubmit} style={styles.submitButton} disabled={!isValid || isLoading} loading={isLoading}>Create Project</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  input: { marginTop: 8 },
  textArea: { minHeight: 120, marginTop: 8 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  tagInput: { flex: 1 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: { marginBottom: 4 },
  submitButton: { marginTop: 24, marginBottom: 32, paddingVertical: 8 },
});

export default CreateProject;
