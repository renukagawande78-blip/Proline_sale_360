import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Official WhatsApp Business API Webhook Gateway Edge Function
serve(async (req) => {
  if (req.method === "GET") {
    // Webhook verification challenge
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[WhatsApp Webhook] Incoming message event:", JSON.stringify(body));

      // Extract interactive button response (APPROVE / HOLD)
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (message && message.type === "interactive") {
        const buttonId = message.interactive?.button_reply?.id; // e.g., "APPROVE_PRL-1054"
        const senderPhone = message.from;

        console.log(`[WhatsApp Approval] Action: ${buttonId} from ${senderPhone}`);

        // Trigger secure PostgreSQL RPC call: fn_approve_order / fn_hold_order with source = 'WHATSAPP'
      }

      return new Response(JSON.stringify({ status: "success" }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
