import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AuthContextType = {
  session: Session | null;
  hasProfile: boolean;
  setHasProfile: (v: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  hasProfile: false,
  setHasProfile: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();
        setHasProfile(!!data);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();
        setHasProfile(!!data);
      } else {
        setHasProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, hasProfile, setHasProfile }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <Stack.Screen name="Main" component={MainStack} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
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
