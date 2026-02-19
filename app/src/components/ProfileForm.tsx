import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { Profile } from "../types";

const POSITIONS = ["Forward", "Midfielder", "Defender", "Goalkeeper"] as const;

type FormData = {
  full_name: string;
  position: string;
  team_name: string;
  contact_email: string;
  height_ft: string;
  height_in: string;
  weight_lbs: string;
};

type Props = {
  initialData?: Partial<Profile>;
  onSubmit: (data: Omit<Profile, "id" | "created_at" | "updated_at">) => Promise<void>;
  submitLabel: string;
};

export default function ProfileForm({ initialData, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<FormData>({
    full_name: initialData?.full_name ?? "",
    position: initialData?.position ?? "",
    team_name: initialData?.team_name ?? "",
    contact_email: initialData?.contact_email ?? "",
    height_ft: initialData?.height_ft?.toString() ?? "",
    height_in: initialData?.height_in?.toString() ?? "",
    weight_lbs: initialData?.weight_lbs?.toString() ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.position) newErrors.position = "Position is required";
    if (!form.team_name.trim()) newErrors.team_name = "Team name is required";
    if (!form.contact_email.trim()) newErrors.contact_email = "Contact email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await onSubmit({
      full_name: form.full_name.trim(),
      position: form.position as Profile["position"],
      team_name: form.team_name.trim(),
      contact_email: form.contact_email.trim(),
      height_ft: form.height_ft ? parseInt(form.height_ft, 10) : null,
      height_in: form.height_in ? parseInt(form.height_in, 10) : null,
      weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs, 10) : null,
    });
    setLoading(false);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={[styles.input, errors.full_name && styles.inputError]}
            value={form.full_name}
            onChangeText={(v) => updateField("full_name", v)}
            placeholder="Enter your full name"
          />
          {errors.full_name && <Text style={styles.error}>{errors.full_name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Position *</Text>
          <TouchableOpacity
            style={[styles.input, styles.picker, errors.position && styles.inputError]}
            onPress={() => setShowPositionPicker(!showPositionPicker)}
          >
            <Text style={form.position ? styles.pickerText : styles.pickerPlaceholder}>
              {form.position || "Select position"}
            </Text>
          </TouchableOpacity>
          {showPositionPicker && (
            <View style={styles.pickerOptions}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.pickerOption,
                    form.position === pos && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    updateField("position", pos);
                    setShowPositionPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      form.position === pos && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.position && <Text style={styles.error}>{errors.position}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>High School / Club Team *</Text>
          <TextInput
            style={[styles.input, errors.team_name && styles.inputError]}
            value={form.team_name}
            onChangeText={(v) => updateField("team_name", v)}
            placeholder="Enter your team name"
          />
          {errors.team_name && <Text style={styles.error}>{errors.team_name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact Email *</Text>
          <TextInput
            style={[styles.input, errors.contact_email && styles.inputError]}
            value={form.contact_email}
            onChangeText={(v) => updateField("contact_email", v)}
            placeholder="Enter contact email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.contact_email && <Text style={styles.error}>{errors.contact_email}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.flex]}>
            <Text style={styles.label}>Height</Text>
            <View style={styles.heightRow}>
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={form.height_ft}
                onChangeText={(v) => updateField("height_ft", v)}
                placeholder="ft"
                keyboardType="number-pad"
                maxLength={1}
              />
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={form.height_in}
                onChangeText={(v) => updateField("height_in", v)}
                placeholder="in"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <View style={[styles.field, styles.flex]}>
            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              value={form.weight_lbs}
              onChangeText={(v) => updateField("weight_lbs", v)}
              placeholder="lbs"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : submitLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  error: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  picker: {
    justifyContent: "center",
  },
  pickerText: {
    fontSize: 16,
    color: "#000",
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pickerOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  pickerOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  heightRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallInput: {
    flex: 1,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
