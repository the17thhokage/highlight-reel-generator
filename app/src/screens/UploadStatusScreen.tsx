import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { MainStackParamList } from "../navigation/MainStack";
import type { Upload } from "../types";

type Props = NativeStackScreenProps<MainStackParamList, "UploadStatus">;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: Upload["status"]): string {
  switch (status) {
    case "ready":
      return "\u2705 Ready";
    case "failed":
      return "\u274c Failed";
    default:
      return "\u23f3 Processing\u2026";
  }
}

export default function UploadStatusScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUploads = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from("uploads")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) setUploads(data);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadUploads();
    }, [loadUploads])
  );

  const renderItem = ({ item }: { item: Upload }) => (
    <View style={styles.uploadCard}>
      <Text style={styles.filename} numberOfLines={1}>
        📹 {item.original_filename}
      </Text>
      <Text style={styles.meta}>
        Uploaded {formatDate(item.created_at)} · {formatBytes(item.file_size_bytes)}
      </Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusBadge}>{statusBadge(item.status)}</Text>
        {item.status === "failed" && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate("Upload")}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!loading && uploads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No uploads yet</Text>
        <Text style={styles.emptySubtitle}>
          Upload game footage to get started
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={uploads}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshing={loading}
      onRefresh={loadUploads}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  uploadCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  filename: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6b7280",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
});
