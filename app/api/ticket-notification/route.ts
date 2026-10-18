import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sakvxjyemhvzetlxhucd.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";
const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return currency + " " + amount; }
};
const formatDeadline = (value: string | null) => {
  if (!value) return "30 minutes from the time the payment instructions were provided";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC";
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { requestId?: string; accessToken?: string; event?: string };
    const requestId = String(body.requestId || "");
    const token = String(body.accessToken || "");
    const event = String(body.event || "");
    const allowedEvents = ["request-received", "payment-details", "receipt-submitted", "payment-verified", "payment-approved", "payment-rejected"];
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^[0-9a-f-]{36}$/i.test(token) || !allowedEvents.includes(event)) {
      return NextResponse.json({ error: "Invalid notification request." }, { status: 400 });
    }

    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "x-ticket-access-token": token } },
    });
    const { data: ticket, error } = await client.from("ticket_requests")
      .select("id,booking_reference,guest_access_token,customer_name,customer_email,customer_phone,country_name,origin,destination,trip_type,departure_date,return_date,travellers_count,cabin_class,ticket_amount,currency,status,payment_status,payment_account_name,payment_bank,payment_account_number,payment_instructions,payment_deadline_at,ticket_number,ticket_details")
      .eq("id", requestId).single();

    if (error || !ticket || String(ticket.guest_access_token) !== token) {
      return NextResponse.json({ error: "Booking request not found." }, { status: 404 });
    }

    // Never trust the event supplied by the browser alone. Verify it against the saved booking state.
    if (event === "request-received" && ticket.status !== "pending") {
      return NextResponse.json({ error: "This request is not in the new-request state." }, { status: 409 });
    }
    if (event === "payment-details" && (ticket.status !== "awaiting_payment" || !ticket.payment_account_number)) {
      return NextResponse.json({ error: "Payment instructions are not ready." }, { status: 409 });
    }
    if (event === "receipt-submitted") {
      const { data: receipts, error: receiptError } = await client.from("ticket_payment_receipts")
        .select("id").eq("request_id", requestId).eq("status", "submitted").limit(1);
      if (receiptError || !receipts?.length) {
        return NextResponse.json({ error: "No submitted receipt was found for this request." }, { status: 409 });
      }
    }
    if (event === "payment-verified" && (ticket.status !== "paid" || ticket.payment_status !== "paid")) {
      return NextResponse.json({ error: "Payment must be verified before sending this update." }, { status: 409 });
    }
    if (event === "payment-approved" && (ticket.status !== "confirmed" || ticket.payment_status !== "paid" || !ticket.ticket_number)) {
      return NextResponse.json({ error: "A ticket can only be confirmed after payment approval." }, { status: 409 });
    }
    if (event === "payment-rejected" && (ticket.status !== "rejected" || ticket.payment_status !== "rejected")) {
      return NextResponse.json({ error: "This receipt has not been marked as rejected." }, { status: 409 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    // EMAIL_FROM is already used by this Vercel project; support the alternate name too.
    const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
    const notifyTo = process.env.BOOKING_NOTIFICATION_EMAIL;
    const missing = [!apiKey && "RESEND_API_KEY", !from && "EMAIL_FROM (or RESEND_FROM_EMAIL)"].filter(Boolean);
    if (missing.length) return NextResponse.json({ sent: false, configured: false, missing });

    const titles: Record<string, string> = {
      "request-received": "We received your ticket request",
      "payment-details": "Your payment instructions are ready",
      "receipt-submitted": "We received your payment receipt",
      "payment-verified": "Payment verified — booking in progress",
      "payment-approved": "Your Book Vacation ticket is confirmed",
      "payment-rejected": "Your payment receipt needs attention",
    };
    const title = titles[event];
    const link = "https://book-vacation.vercel.app/tickets?reference=" + encodeURIComponent(ticket.booking_reference) + (event === "payment-approved" ? "&access=" + encodeURIComponent(token) : "");
    const route = esc(ticket.origin) + " → " + esc(ticket.destination);
    const price = money(Number(ticket.ticket_amount), ticket.currency);
    const deadline = formatDeadline(ticket.payment_deadline_at);
    let detail = "";

    if (event === "payment-details") {
      detail = "<div style='margin:24px 0;padding:20px;background:#f2f7ff;border:1px solid #d8e6ff;border-radius:12px'><h2 style='margin:0 0 14px;font-size:18px;color:#12356d'>Payment instructions</h2><p style='margin:8px 0'><b>Account name:</b> " + esc(ticket.payment_account_name) + "</p><p style='margin:8px 0'><b>Bank:</b> " + esc(ticket.payment_bank) + "</p><p style='margin:8px 0'><b>Account number:</b> " + esc(ticket.payment_account_number) + "</p><p style='margin:8px 0'><b>Amount due:</b> " + esc(price) + "</p><p style='margin:8px 0;white-space:pre-line'>" + esc(ticket.payment_instructions) + "</p><p style='margin:16px 0 0;color:#a13b13'><b>Payment deadline:</b> Please complete payment within 30 minutes, by " + esc(deadline) + ". If payment is not completed in time, your request may expire and you may need to submit a new request.</p></div>";
    } else if (event === "payment-verified") {
      detail = "<div style='margin:24px 0;padding:20px;background:#f2f7ff;border:1px solid #d8e6ff;border-radius:12px'><p style='margin:0 0 8px;font-weight:700;color:#12356d'>PAYMENT VERIFIED</p><p style='margin:0;line-height:1.7'>Your payment receipt has been approved. Our booking team is now completing the airline booking. Your ticket is not confirmed until you receive the airline ticket number and confirmation email.</p></div>";
    } else if (event === "payment-approved") {
      detail = "<div style='margin:24px 0;padding:22px;background:#effaf4;border:1px solid #bfe8cf;border-radius:12px'><p style='margin:0 0 8px;color:#137547;font-weight:700'>BOOKING CONFIRMED · TICKET DETAILS RECORDED</p><p style='margin:0 0 6px;color:#526477;font-size:12px;text-transform:uppercase;letter-spacing:1px'>Your ticket number</p><p style='margin:0;font-size:26px;font-weight:800;letter-spacing:1px;color:#12356d'>" + esc(ticket.ticket_number) + "</p><p style='margin:14px 0 0;white-space:pre-line'>" + esc(ticket.ticket_details || "Your booking details have been recorded. Please verify your official airline e-ticket before travelling.") + "</p><p style='margin:16px 0 0'><b>Your private access code:</b> " + esc(token) + "</p><p style='margin:8px 0 0;color:#536579;font-size:12px'>Keep this code private. It lets you access the full booking details.</p></div>";
    } else if (event === "payment-rejected") {
      detail = "<div style='margin:24px 0;padding:18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px'><p style='margin:0 0 8px;font-weight:700;color:#9a3412'>We could not verify this receipt.</p><p style='margin:0;color:#7c4a2d'>Please check the payment details and upload a clear, correct receipt, or contact the Book Vacation Reservations Team for assistance.</p></div>";
    } else if (event === "receipt-submitted") {
      detail = "<p style='margin:20px 0;padding:16px;background:#f2f7ff;border-radius:10px'>Your receipt has been received and is awaiting verification. Uploading a receipt does not itself confirm a ticket. We will email you when the review is complete.</p>";
    } else {
      detail = "<p style='margin:20px 0'>Your request has been recorded. Your booking reference is shown above. Wait for our team to verify the airline fare and send payment instructions. Your private access code will be sent only after the ticket is confirmed.</p>";
    }

    const rows = "<p style='margin:8px 0'><b>Booking reference:</b> " + esc(ticket.booking_reference) + "</p><p style='margin:8px 0'><b>Route:</b> " + route + "</p><p style='margin:8px 0'><b>Trip:</b> " + esc(ticket.trip_type === "oneway" ? "One way" : "Return") + "</p><p style='margin:8px 0'><b>Departure:</b> " + esc(ticket.departure_date) + (ticket.return_date ? "<br/><b>Return:</b> " + esc(ticket.return_date) : "") + "</p><p style='margin:8px 0'><b>Travellers:</b> " + esc(ticket.travellers_count) + "</p><p style='margin:8px 0'><b>Request amount:</b> " + esc(price) + "</p>";
    const html = "<!doctype html><html><body style='margin:0;padding:24px 10px;background:#f3f7fd;font-family:Arial,Helvetica,sans-serif;color:#24364b'><div style='max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e3ebf7'><div style='padding:28px 30px;background:#0b1f4d;color:#fff'><div style='font-size:27px;font-weight:800;letter-spacing:-.5px'>Book <span style='color:#75b6ff'>Vacation</span></div><p style='margin:9px 0 0;color:#cbdcf7;font-size:11px;letter-spacing:1.8px'>YOUR WORLD. YOUR HOLIDAY.</p></div><div style='height:5px;background:#2563eb'></div><div style='padding:30px'><p style='margin:0 0 10px;color:#2563eb;font-size:11px;font-weight:700;letter-spacing:1.5px'>BOOKING UPDATE</p><h1 style='margin:0 0 18px;font-size:25px;line-height:1.3;color:#102a56'>" + esc(title) + "</h1><p>Hello " + esc(ticket.customer_name) + ",</p><p style='line-height:1.7;color:#536579'>Thank you for choosing Book Vacation. Here is the latest update on your travel request.</p><div style='margin:22px 0;padding:18px;background:#f8faff;border:1px solid #e1eaf8;border-radius:12px'>" + rows + "</div>" + detail + "<p style='margin:28px 0'><a href='" + esc(link) + "' style='display:inline-block;background:#1455c0;color:#fff;text-decoration:none;padding:13px 19px;border-radius:8px;font-weight:700'>View your booking</a></p><p style='font-size:13px;line-height:1.7;color:#617187'>For your security, keep your private booking link confidential.</p><p style='margin:24px 0 0;font-weight:700;color:#102a56'>Kind regards,<br/>Book Vacation Reservations Team</p></div><div style='padding:20px 25px;text-align:center;background:#f8faff;border-top:1px solid #e7edf6;color:#8290a3;font-size:11px;line-height:1.7'>This is an automated booking update from Book Vacation.<br/>Please do not reply directly to this email.</div></div></body></html>";
    const text = [
      title, "Hello " + ticket.customer_name, "Booking reference: " + ticket.booking_reference,
      "Route: " + ticket.origin + " to " + ticket.destination, "Trip: " + ticket.trip_type,
      "Departure: " + ticket.departure_date, ticket.return_date ? "Return: " + ticket.return_date : "",
      "Travellers: " + ticket.travellers_count, "Request amount: " + price,
      event === "payment-details" ? "Account name: " + ticket.payment_account_name + "\nBank: " + ticket.payment_bank + "\nAccount number: " + ticket.payment_account_number + "\nAmount due: " + price + "\nInstructions: " + ticket.payment_instructions + "\nPayment deadline: " + deadline + " (within 30 minutes)" : "",
      event === "payment-approved" ? "TICKET NUMBER: " + ticket.ticket_number + "\nTicket details: " + (ticket.ticket_details || "Your payment has been approved and your ticket has been issued.") : "",
      event === "payment-rejected" ? "We could not verify this receipt. Please check the payment details and upload a clear, correct receipt, or contact the Book Vacation Reservations Team." : "",
      "View your booking: " + link, "Book Vacation Reservations Team"
    ].filter(Boolean).join("\n");
    const recipients = Array.from(new Set([ticket.customer_email, notifyTo].filter(Boolean)));
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: recipients, subject: title + " · " + ticket.booking_reference, html, text }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ sent: false, error: "Email provider rejected the message." }, { status: 502 });
    return NextResponse.json({ sent: true, id: result.id });
  } catch {
    return NextResponse.json({ error: "Unable to send the booking notification." }, { status: 500 });
  }
}
