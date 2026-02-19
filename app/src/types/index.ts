export interface Profile {
  id: string;
  full_name: string;
  position: "Forward" | "Midfielder" | "Defender" | "Goalkeeper";
  team_name: string;
  contact_email: string;
  height_ft: number | null;
  height_in: number | null;
  weight_lbs: number | null;
  created_at: string;
  updated_at: string;
}

export type UploadStatus = "queued" | "processing" | "ready" | "failed";

export interface Upload {
  id: string;
  user_id: string;
  storage_path: string;
  original_filename: string;
  file_size_bytes: number;
  status: UploadStatus;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}
