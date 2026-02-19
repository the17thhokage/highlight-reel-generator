import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./RootNavigator";
import HomeScreen from "../screens/HomeScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import UploadScreen from "../screens/UploadScreen";
import UploadStatusScreen from "../screens/UploadStatusScreen";

export type MainStackParamList = {
  Home: undefined;
  ProfileSetup: undefined;
  ProfileEdit: undefined;
  Upload: undefined;
  UploadStatus: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  const { hasProfile } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={hasProfile ? "Home" : "ProfileSetup"}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{
          title: "Set Up Your Athlete Profile",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: "Edit Profile" }}
      />
      <Stack.Screen
        name="Upload"
        component={UploadScreen}
        options={{ title: "Upload Footage" }}
      />
      <Stack.Screen
        name="UploadStatus"
        component={UploadStatusScreen}
        options={{ title: "My Uploads" }}
      />
    </Stack.Navigator>
  );
}
