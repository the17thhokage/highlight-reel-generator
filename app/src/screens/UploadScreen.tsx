import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../navigation/RootNavigator";
import type { MainStackParamList } from "../navigation/MainStack";

type Props = NativeStackScreenProps<MainStackParamList, "Upload">;

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function UploadScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const pickVideo = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || asset.uri.split("/").pop() || "video.mp4";
    const fileSize = asset.fileSize || 0;
    const mimeType = asset.mimeType || "video/mp4";

    if (fileSize > MAX_FILE_SIZE) {
      setError("File is too large. Max 4 GB.");
      return;
    }

    setSelectedFile({
      uri: asset.uri,
      name: fileName,
      size: fileSize,
      mimeType,
    });
  };

  const getPushToken = async (): Promise<string | null> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return null;
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  };

  const startUpload = async () => {
    if (!selectedFile || !session) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    const pushToken = await getPushToken();

    const ext = selectedFile.name.split(".").pop() || "mp4";
    const fileId = generateUUID();
    const storagePath = `${session.user.id}/${fileId}.${ext}`;

    try {
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("raw-uploads")
        .upload(storagePath, blob, {
          contentType: selectedFile.mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Simulate progress completion
      setProgress(100);

      // Create uploads row
      const { error: dbError } = await supabase.from("uploads").insert({
        user_id: session.user.id,
        storage_path: `raw-uploads/${storagePath}`,
        original_filename: selectedFile.name,
        file_size_bytes: selectedFile.size,
        status: "queued",
        push_token: pushToken,
      });

      if (dbError) throw dbError;

      setUploading(false);
      setSelectedFile(null);
      navigation.navigate("UploadStatus");
    } catch (err: any) {
      setUploading(false);
      if (err?.message?.includes("network") || err?.message?.includes("fetch")) {
        setError("Upload interrupted. Tap Retry.");
      } else {
        setError("Upload failed. Please try again.");
      }
    }
  };

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {!selectedFile && !uploading && (
        <TouchableOpacity style={styles.pickArea} onPress={pickVideo}>
          <Text style={styles.pickIcon}>📹</Text>
          <Text style={styles.pickText}>Tap to select video</Text>
          <Text style={styles.pickSubtext}>from camera roll</Text>
          <Text style={styles.pickSubtext}>(MP4 or MOV)</Text>
        </TouchableOpacity>
      )}

      {selectedFile && !uploading && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>📄 {selectedFile.name}</Text>
          <Text style={styles.fileSize}>Size: {formatBytes(selectedFile.size)}</Text>

          <TouchableOpacity style={styles.uploadButton} onPress={startUpload}>
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSelectedFile(null)}
          >
            <Text style={styles.cancelText}>Choose Different File</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.fileName}>📄 {selectedFile?.name}</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          <Text style={styles.uploadingText}>
            Uploading… do not close app
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelUpload}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={startUpload}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  pickArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    marginVertical: 24,
  },
  pickIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pickText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  pickSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  fileInfo: {
    marginTop: 24,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  fileSize: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 16,
  },
  progressContainer: {
    marginTop: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 4,
  },
  progressText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 8,
  },
  uploadingText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
