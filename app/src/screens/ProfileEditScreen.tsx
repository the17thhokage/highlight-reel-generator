import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../navigation/RootNavigator";
import ProfileForm from "../components/ProfileForm";
import type { MainStackParamList } from "../navigation/MainStack";
import type { Profile } from "../types";

type Props = NativeStackScreenProps<MainStackParamList, "ProfileEdit">;

export default function ProfileEditScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          Alert.alert("Error", error.message);
        } else {
          setProfile(data);
        }
        setLoading(false);
      });
  }, [session]);

  const handleSubmit = async (
    data: Omit<Profile, "id" | "created_at" | "updated_at">
  ) => {
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", session.user.id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Success", "Profile updated successfully.");
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  return (
    <ProfileForm
      initialData={profile}
      onSubmit={handleSubmit}
      submitLabel="Update Profile"
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
