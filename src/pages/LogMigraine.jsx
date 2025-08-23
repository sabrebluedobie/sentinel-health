// LogMigraine.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import PropTypes from 'prop-types';

// ---- Replace with your app's theme or import your tokens ----
const theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F7F8FA',
    border: '#E6E8EE',
    textPrimary: '#101828',
    textSecondary: '#475467',
    primary: '#3B82F6',
    primaryPressed: '#2563EB',
    focus: '#93C5FD',
    shadow: 'rgba(16, 24, 40, 0.04)',
  },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  space: { xs: 6, sm: 10, md: 16, lg: 20, xl: 24, xxl: 32 },
  text: { h2: 22, label: 14, body: 16, small: 13, button: 16 },
};
// --------------------------------------------------------------

const DEFAULT_SYMPTOMS = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'aura', label: 'Aura' },
  { id: 'photophobia', label: 'Light Sensitivity' },
  { id: 'phonophobia', label: 'Sound Sensitivity' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'neck', label: 'Neck Pain' },
];

function LogMigraine({
  initialPain = 0,
  initialSymptoms = [],
  initialNotes = '',
  symptomOptions = DEFAULT_SYMPTOMS,
  onSave,
}) {
  const [pain, setPain] = useState(initialPain);
  const [selected, setSelected] = useState(initialSymptoms);
  const [notes, setNotes] = useState(initialNotes);

  useMemo(
    () => new Map(symptomOptions.map((s) => [s.id, s.label])),
    [symptomOptions]
  );

  const toggleSymptom = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave && onSave({ pain, symptoms: selected, notes });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card} accessible accessibilityRole="summary">
          <Text style={styles.heading} accessibilityRole="header">
            Log Migraine
          </Text>

          {/* Pain Level */}
          <Text style={styles.label}>Pain Level</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.scaleText} accessibilityLabel={`Pain level ${pain}`}>
              {pain}
            </Text>
            <Text style={styles.scaleHint}>0 (none) – 10 (worst)</Text>
          </View>
          <Slider
            accessibilityLabel="Pain level slider"
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={pain}
            onValueChange={setPain}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />

          {/* Symptoms */}
          <Text style={styles.label}>Symptoms</Text>
          <FlatList
            data={symptomOptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tagsWrap}
            numColumns={3}
            renderItem={({ item }) => {
              const isActive = selected.includes(item.id);
              return (
                <Pressable
                  onPress={() => toggleSymptom(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={item.label}
                  style={({ pressed, focused }) => [
                    styles.tag,
                    isActive && styles.tagActive,
                    (pressed || focused) && styles.tagPressed,
                  ]}
                >
                  <Text style={[styles.tagText, isActive && styles.tagTextActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* Notes */}
          <Text style={styles.label}>Notes</Text>
          <TextInput
            accessibilityLabel="Notes input"
            style={styles.input}
            placeholder="Add details (duration, triggers, meds, etc.)"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={notes}
            onChangeText={setNotes}
            returnKeyType="done"
          />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              style={({ pressed, focused }) => [
                styles.primaryButton,
                (pressed || focused) && styles.primaryButtonPressed, // ✅ fixed conditional
              ]}
            >
              <Text style={styles.primaryButtonText}>Save Entry</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

LogMigraine.propTypes = {
  initialPain: PropTypes.number,
  initialSymptoms: PropTypes.arrayOf(PropTypes.string),
  initialNotes: PropTypes.string,
  symptomOptions: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ),
  onSave: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    padding: theme.space.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heading: {
    fontSize: theme.text.h2,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.space.md,
  },
  label: {
    fontSize: theme.text.label,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.space.lg,
    marginBottom: theme.space.xs,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  scaleText: {
    fontSize: theme.text.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  scaleHint: {
    fontSize: theme.text.small,
    color: theme.colors.textSecondary,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: theme.space.xs,
  },
  tagsWrap: {
    gap: theme.space.sm,
    paddingVertical: theme.space.xs,
  },
  tag: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space.xs + 2,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    marginRight: theme.space.sm,
    marginBottom: theme.space.sm,
    backgroundColor: '#FFF',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  tagPressed: {
    borderColor: theme.colors.primaryPressed,
  },
  tagText: {
    fontSize: theme.text.body,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  tagTextActive: {
    color: theme.colors.primaryPressed,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    fontSize: theme.text.body,
    color: theme.colors.textPrimary,
    backgroundColor: '#FFF',
    minHeight: 110,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: theme.space.xl,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.space.sm + 2,
    paddingHorizontal: theme.space.xl,
    borderRadius: theme.radius.md,
  },
  primaryButtonPressed: {
    backgroundColor: theme.colors.primaryPressed,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: theme.text.button,
    fontWeight: '700',
  },
});

export default LogMigraine;