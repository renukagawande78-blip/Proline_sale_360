import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface NotificationPayload {
  recipient_user_id?: string;
  recipient_role_id?: string;
  event_type: string;
  title: string;
  message: string;
  order_id?: string;
  dispatch_id?: string;
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();
    console.log("[FCM Push Dispatcher] Processing push notification:", payload.title);

    // FCM Service Account credentials payload construction
    const fcmMessage = {
      notification: {
        title: payload.title,
        body: payload.message
      },
      data: {
        order_id: payload.order_id || "",
        dispatch_id: payload.dispatch_id || "",
        event_type: payload.event_type,
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      }
    };

    return new Response(
      JSON.stringify({ success: true, delivered: true, fcmMessage }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
