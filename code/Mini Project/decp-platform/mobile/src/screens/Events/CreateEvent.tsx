import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
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
  Switch,
  Divider,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../../store';
import { createEvent } from '../../features/eventsSlice';
import { RootScreenProps } from '../../navigation/types';
import { EVENT_TYPES } from '../../utils/constants';

type Props = RootScreenProps<'CreateEvent'>;

const CreateEvent: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.events);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '' as typeof EVENT_TYPES[0]['value'] | '',
    locationType: 'physical' as 'physical' | 'virtual' | 'hybrid',
    address: '',
    link: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
    hasMaxAttendees: false,
    maxAttendees: '',
  });

  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const pickBanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBanner(result.assets[0].uri);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        location: {
          type: formData.locationType,
          address: formData.locationType !== 'virtual' ? formData.address : undefined,
          link: formData.locationType !== 'physical' ? formData.link : undefined,
        },
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        maxAttendees: formData.hasMaxAttendees ? parseInt(formData.maxAttendees) : undefined,
      };

      await dispatch(createEvent(eventData)).unwrap();
      navigation.goBack();
    } catch (error) {
      // Error handled by slice
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date, field?: string) => {
    if (selectedDate) {
      if (field === 'startDate') {
        updateField('startDate', selectedDate);
        setShowStartDate(false);
      } else if (field === 'startTime') {
        const newDate = new Date(formData.startDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        updateField('startDate', newDate);
        setShowStartTime(false);
      } else if (field === 'endDate') {
        updateField('endDate', selectedDate);
        setShowEndDate(false);
      } else if (field === 'endTime') {
        const newDate = new Date(formData.endDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        updateField('endDate', newDate);
        setShowEndTime(false);
      }
    }
  };

  const isValid =
    formData.title.trim() &&
    formData.description.trim() &&
    formData.type &&
    ((formData.locationType !== 'virtual' && formData.address) ||
      (formData.locationType !== 'physical' && formData.link));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create Event" />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Banner Upload */}
        <TouchableOpacity style={styles.bannerContainer} onPress={pickBanner}>
          {banner ? (
            <Image source={{ uri: banner }} style={styles.banner} />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="image-plus" size={48} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                Add Event Banner
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Event Details
        </Text>

        <TextInput
          label="Event Title *"
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          mode="outlined"
        />

        <Menu
          visible={showTypeMenu}
          onDismiss={() => setShowTypeMenu(false)}
          anchor={
            <TextInput
              label="Event Type *"
              value={EVENT_TYPES.find((t) => t.value === formData.type)?.label || ''}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="menu-down" onPress={() => setShowTypeMenu(true)} />}
              onPressIn={() => setShowTypeMenu(true)}
            />
          }
        >
          {EVENT_TYPES.map((type) => (
            <Menu.Item
              key={type.value}
              onPress={() => {
                updateField('type', type.value);
                setShowTypeMenu(false);
              }}
              title={type.label}
              leadingIcon={type.icon}
            />
          ))}
        </Menu>

        <TextInput
          label="Description *"
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.textArea}
          textAlignVertical="top"
        />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Date & Time
        </Text>

        <View style={styles.dateTimeRow}>
          <Button
            mode="outlined"
            onPress={() => setShowStartDate(true)}
            style={styles.dateButton}
            icon="calendar"
          >
            {formData.startDate.toLocaleDateString()}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowStartTime(true)}
            style={styles.timeButton}
            icon="clock"
          >
            {formData.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Button>
        </View>

        <View style={styles.dateTimeRow}>
          <Button
            mode="outlined"
            onPress={() => setShowEndDate(true)}
            style={styles.dateButton}
            icon="calendar"
          >
            {formData.endDate.toLocaleDateString()}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowEndTime(true)}
            style={styles.timeButton}
            icon="clock"
          >
            {formData.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Button>
        </View>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Location
        </Text>

        <Menu
          visible={showLocationMenu}
          onDismiss={() => setShowLocationMenu(false)}
          anchor={
            <TextInput
              label="Location Type"
              value={formData.locationType.charAt(0).toUpperCase() + formData.locationType.slice(1)}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="menu-down" onPress={() => setShowLocationMenu(true)} />}
              onPressIn={() => setShowLocationMenu(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              updateField('locationType', 'physical');
              setShowLocationMenu(false);
            }}
            title="Physical"
            leadingIcon="map-marker"
          />
          <Menu.Item
            onPress={() => {
              updateField('locationType', 'virtual');
              setShowLocationMenu(false);
            }}
            title="Virtual"
            leadingIcon="video"
          />
          <Menu.Item
            onPress={() => {
              updateField('locationType', 'hybrid');
              setShowLocationMenu(false);
            }}
            title="Hybrid"
            leadingIcon="home-group"
          />
        </Menu>

        {formData.locationType !== 'virtual' && (
          <TextInput
            label="Address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="map-marker" />}
          />
        )}

        {formData.locationType !== 'physical' && (
          <TextInput
            label="Meeting Link"
            value={formData.link}
            onChangeText={(text) => updateField('link', text)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="link" />}
            placeholder="https://..."
          />
        )}

        <View style={styles.maxAttendeesRow}>
          <Text variant="bodyMedium">Limit Attendees</Text>
          <Switch
            value={formData.hasMaxAttendees}
            onValueChange={(value) => updateField('hasMaxAttendees', value)}
          />
        </View>

        {formData.hasMaxAttendees && (
          <TextInput
            label="Maximum Attendees"
            value={formData.maxAttendees}
            onChangeText={(text) => updateField('maxAttendees', text)}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Icon icon="account-group" />}
          />
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          Create Event
        </Button>
      </ScrollView>

      {showStartDate && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          onChange={(event, date) => onDateChange(event, date, 'startDate')}
        />
      )}
      {showStartTime && (
        <DateTimePicker
          value={formData.startDate}
          mode="time"
          onChange={(event, date) => onDateChange(event, date, 'startTime')}
        />
      )}
      {showEndDate && (
        <DateTimePicker
          value={formData.endDate}
          mode="date"
          onChange={(event, date) => onDateChange(event, date, 'endDate')}
        />
      )}
      {showEndTime && (
        <DateTimePicker
          value={formData.endDate}
          mode="time"
          onChange={(event, date) => onDateChange(event, date, 'endTime')}
        />
      )}
    </KeyboardAvoidingView>
  );
};

import { MaterialCommunityIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bannerContainer: {
    marginBottom: 16,
  },
  banner: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ccc',
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
    minHeight: 100,
    marginTop: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 2,
  },
  timeButton: {
    flex: 1,
  },
  maxAttendeesRow: {
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

export default CreateEvent;
