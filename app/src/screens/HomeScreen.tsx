import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../navigation/RootNavigator";
import type { MainStackParamList } from "../navigation/MainStack";
import type { Upload } from "../types";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

type ConnectionStatus = {
  db: boolean | null;
  auth: boolean | null;
  storage: boolean | null;
};

export default function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>({
    db: null,
    auth: null,
    storage: null,
  });
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [uploadCount, setUploadCount] = useState(0);

  const checkConnections = useCallback(async () => {
    if (!session) return;

    // DB check
    try {
      await supabase.from("profiles").select("id", { count: "exact", head: true });
      setStatus((s) => ({ ...s, db: true }));
    } catch {
      setStatus((s) => ({ ...s, db: false }));
    }

    // Auth check
    const { data: { session: sess } } = await supabase.auth.getSession();
    setStatus((s) => ({ ...s, auth: !!sess }));

    // Storage check
    try {
      await supabase.storage
        .from("raw-uploads")
        .list(session.user.id, { limit: 1 });
      setStatus((s) => ({ ...s, storage: true }));
    } catch {
      setStatus((s) => ({ ...s, storage: false }));
    }
  }, [session]);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();
    if (data) {
      setFirstName(data.full_name.split(" ")[0]);
    }
  }, [session]);

  const loadUploads = useCallback(async () => {
    if (!session) return;
    const { data, count } = await supabase
      .from("uploads")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) setRecentUploads(data);
    if (count !== null) setUploadCount(count);
  }, [session]);

  useEffect(() => {
    loadProfile();
    checkConnections();
  }, [loadProfile, checkConnections]);

  useFocusEffect(
    useCallback(() => {
      loadUploads();
    }, [loadUploads])
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const statusIcon = (v: boolean | null) =>
    v === null ? "..." : v ? "\u2705" : "\u274c";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Highlight Reel</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ProfileEdit")}>
          <Text style={styles.settingsIcon}>{"\u2699\uFE0F"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Hey, {firstName || "Athlete"}</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusRow}>
          {statusIcon(status.db)} Connected to Supabase
        </Text>
        <Text style={styles.statusRow}>
          {statusIcon(status.auth)} Auth active
        </Text>
        <Text style={styles.statusRow}>
          {statusIcon(status.storage)} Storage ready
        </Text>
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => navigation.navigate("Upload")}
      >
        <Text style={styles.uploadButtonText}>+ Upload Game Footage</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => navigation.navigate("UploadStatus")}
        >
          <Text style={styles.sectionTitle}>Recent Uploads</Text>
          {uploadCount > 0 && (
            <Text style={styles.uploadCount}>{uploadCount}</Text>
          )}
        </TouchableOpacity>

        {recentUploads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No uploads yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap above to get started
            </Text>
          </View>
        ) : (
          recentUploads.map((upload) => (
            <View key={upload.id} style={styles.uploadRow}>
              <Text style={styles.uploadFilename} numberOfLines={1}>
                {upload.original_filename}
              </Text>
              <Text style={styles.uploadStatus}>
                {upload.status === "ready"
                  ? "\u2705 Ready"
                  : upload.status === "failed"
                  ? "\u274c Failed"
                  : "\u23f3 Processing"}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  settingsIcon: {
    fontSize: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 20,
  },
  statusRow: {
    fontSize: 15,
  },
  uploadButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  uploadCount: {
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  emptyState: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  uploadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadFilename: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  uploadStatus: {
    fontSize: 13,
  },
  signOutButton: {
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  signOutText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "500",
  },
});
