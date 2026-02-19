import React from "react";
import { Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../navigation/RootNavigator";
import ProfileForm from "../components/ProfileForm";
import type { MainStackParamList } from "../navigation/MainStack";
import type { Profile } from "../types";

type Props = NativeStackScreenProps<MainStackParamList, "ProfileSetup">;

export default function ProfileSetupScreen({ navigation }: Props) {
  const { session, setHasProfile } = useAuth();

  const handleSubmit = async (
    data: Omit<Profile, "id" | "created_at" | "updated_at">
  ) => {
    if (!session) return;

    const { error } = await supabase.from("profiles").insert({
      id: session.user.id,
      ...data,
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setHasProfile(true);
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return <ProfileForm onSubmit={handleSubmit} submitLabel="Save Profile" />;
}
