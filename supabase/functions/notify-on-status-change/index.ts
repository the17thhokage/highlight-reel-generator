import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface WebhookPayload {
  type: "UPDATE";
  table: string;
  schema: string;
  record: {
    id: string;
    status: string;
    push_token: string | null;
    original_filename: string;
  };
  old_record: {
    id: string;
    status: string;
  };
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    // Only process status changes to 'ready' or 'failed'
    if (
      payload.old_record.status === payload.record.status ||
      (payload.record.status !== "ready" && payload.record.status !== "failed")
    ) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Skip if no push token (permission was denied)
    if (!payload.record.push_token) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_push_token" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const title =
      payload.record.status === "ready"
        ? "Your highlight reel is ready!"
        : "Processing failed — please retry";

    const body = payload.record.original_filename;

    // Send push notification via Expo Push API
    const pushResponse = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: payload.record.push_token,
          title,
          body,
          data: { screen: "UploadStatus" },
          sound: "default",
        }),
      }
    );

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({ sent: true, result: pushResult }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
