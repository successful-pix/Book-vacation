"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, Bitcoin, CheckCircle2, Clock3, Copy, CreditCard, Headphones, LockKeyhole, RefreshCw, ShieldCheck, UploadCloud, WalletCards } from "lucide-react";
import Link from "next/link";
import { TravelShell } from "../components/TravelShell";

type PaymentMethod = "bank_transfer" | "crypto";
type Ticket = {
  id: string; booking_reference: string; guest_access_token: string;
  customer_name: string; customer_email: string; origin: string; destination: string;
  departure_date: string; return_date: string | null; travellers_count: number;
  cabin_class: string; ticket_amount: number; currency: string; status: string;
  payment_status: string; payment_method: PaymentMethod | string;
  payment_account_name: string; payment_bank: string; payment_account_number: string;
  payment_instructions: string; payment_deadline_at: string | null;
};
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sakvxjyemhvzetlxhucd.supabase.co";
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";
const clientFor = (token: string) => createClient(apiUrl, apiKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { headers: { "x-ticket-access-token": token } } });
const price = (amount: number, currency: string) => { try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); } catch { return currency + " " + amount.toLocaleString(); } };

export default function TicketPaymentPage() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = (params.get("reference") || "").toUpperCase();
  const access = params.get("access") || "";
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [file, setFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    if (!reference || !access) { setError("This payment link is incomplete. Open it from your booking confirmation or enter your booking reference on the ticket page."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const c = clientFor(access);
      const { data, error: queryError } = await c.from("ticket_requests").select("*").eq("booking_reference", reference).maybeSingle();
      if (queryError) throw queryError;
      if (!data) throw new Error("We could not find this booking. Please check your private booking link.");
      const row = data as Ticket;
      setTicket(row);
      if (row.payment_method === "crypto" || row.payment_method === "bank_transfer") setMethod(row.payment_method);
      try {
        localStorage.setItem("book-vacation-ticket-last", JSON.stringify(row));
        const raw = JSON.parse(localStorage.getItem("book-vacation-ticket-history") || "[]");
        if (Array.isArray(raw)) localStorage.setItem("book-vacation-ticket-history", JSON.stringify([{ booking_reference: row.booking_reference, guest_access_token: access, origin: row.origin, destination: row.destination, departure_date: row.departure_date, return_date: row.return_date, status: row.status, payment_status: row.payment_status, created_at: new Date().toISOString() }, ...raw.filter((x:any) => x?.booking_reference !== row.booking_reference)].slice(0,30)));
      } catch {}
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load payment details."); }
    finally { setLoading(false); }
  }, [reference, access]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const remaining = useMemo(() => ticket?.payment_deadline_at ? new Date(ticket.payment_deadline_at).getTime() - now : null, [ticket?.payment_deadline_at, now]);
  const isExpired = remaining !== null && remaining <= 0 && ticket?.payment_status !== "submitted" && ticket?.payment_status !== "paid";
  const detailsReady = Boolean(ticket && (ticket.status === "awaiting_payment" || ticket.status === "receipt_submitted" || ticket.status === "paid" || ticket.status === "confirmed") && (ticket.payment_account_number || ticket.payment_instructions || ticket.payment_account_name || ticket.payment_bank));

  async function chooseMethod(next: PaymentMethod) {
    if (!ticket || !access) return;
    setMethod(next); setSavingMethod(true); setError(""); setNotice("");
    try {
      const c = clientFor(access);
      const { error: rpcError } = await c.rpc("choose_ticket_payment_method", { p_reference: reference, p_access_token: access, p_method: next });
      if (rpcError) throw rpcError;
      setTicket({ ...ticket, payment_method: next });
      setNotice(next === "bank_transfer" ? "Bank transfer selected." : "Cryptocurrency selected.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your payment choice."); }
    finally { setSavingMethod(false); }
  }

  async function submitReceipt(e: FormEvent) {
    e.preventDefault();
    if (!ticket || !file || !access) return;
    if (isExpired) { setError("The 30-minute payment window has expired. Contact support for updated payment instructions before sending money."); return; }
    setUploading(true); setError(""); setNotice("");
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file smaller than 10 MB.");
      if (!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)) throw new Error("Upload a JPG, PNG, WEBP or PDF receipt.");
      const c = clientFor(access);
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = ticket.id + "/" + crypto.randomUUID() + "-" + safe;
      const { error: uploadError } = await c.storage.from("ticket-payment-receipts").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: insertError } = await c.from("ticket_payment_receipts").insert({ request_id: ticket.id, booking_reference: ticket.booking_reference, receipt_path: path, payment_reference: paymentReference.trim() });
      if (insertError) throw insertError;
      setTicket({ ...ticket, status: "receipt_submitted", payment_status: "submitted" });
      setNotice("Receipt submitted successfully. Payment is pending review; your ticket is not confirmed until the booking team verifies the payment.");
      setFile(null); setPaymentReference("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not submit the receipt. Please try again."); }
    finally { setUploading(false); }
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 1800); }
    catch { setError("Copy was not available on this device. Please select and copy the details manually."); }
  }

  return <TravelShell><main className="pay-page"><div className="container pay-container">
    <Link href="/tickets" className="pay-back"><ArrowLeft size={16}/> Back to tickets</Link>
    <div className="pay-heading"><span className="pay-kicker"><LockKeyhole size={15}/> SECURE BOOKING PAYMENT</span><h1>Complete your <em>payment</em></h1><p>Choose a payment method for your ticket request, follow the instructions supplied by our booking team, and upload your receipt for review.</p></div>
    {loading ? <div className="pay-panel pay-loading"><RefreshCw className="pay-spin" size={22}/> Loading your booking…</div> : error && !ticket ? <div className="pay-alert pay-error" role="alert">{error}<p><Link href="/tickets">Return to ticket requests</Link></p></div> : ticket ? <>
      <section className="pay-summary"><div><span className="pay-label">BOOKING REFERENCE</span><strong>{ticket.booking_reference}</strong><small>{ticket.origin} → {ticket.destination}</small></div><div><span className="pay-label">AMOUNT DUE</span><strong>{price(Number(ticket.ticket_amount), ticket.currency)}</strong><small>{ticket.travellers_count} traveller{ticket.travellers_count===1?"":"s"} · {ticket.cabin_class}</small></div></section>
      {error && <div className="pay-alert pay-error" role="alert">{error}</div>}{notice && <div className="pay-alert pay-success" role="status"><CheckCircle2 size={17}/>{notice}</div>}
      {ticket.payment_status === "submitted" || ticket.payment_status === "paid" ? <div className="pay-review"><CheckCircle2 size={23}/><div><strong>{ticket.payment_status === "paid" ? "Payment verified" : "Receipt received"}</strong><p>{ticket.payment_status === "paid" ? "Your payment has been marked as received by the booking team." : "Your receipt is awaiting verification. Do not upload again unless support asks you to."}</p></div></div> : <>
        <section className="pay-panel"><div className="pay-section-title"><span>1</span><div><h2>Choose how to pay</h2><p>Select your preferred method below.</p></div></div>
          <div className="pay-methods">
            <button type="button" className={"pay-method"+(method==="bank_transfer"?" selected":"")} onClick={()=>void chooseMethod("bank_transfer")} disabled={savingMethod||isExpired}><span className="pay-method-icon"><CreditCard size={22}/></span><span><strong>Bank transfer</strong><small>Transfer from your bank or banking app</small></span><span className="pay-radio">{method==="bank_transfer"?"✓":""}</span></button>
            <button type="button" className={"pay-method"+(method==="crypto"?" selected":"")} onClick={()=>void chooseMethod("crypto")} disabled={savingMethod||isExpired}><span className="pay-method-icon"><Bitcoin size={23}/></span><span><strong>Crypto payment</strong><small>Send cryptocurrency to the supplied wallet</small></span><span className="pay-radio">{method==="crypto"?"✓":""}</span></button>
          </div>
          {savingMethod && <p className="pay-muted">Saving your selection…</p>}
        </section>
        <section className="pay-panel"><div className="pay-section-title"><span>2</span><div><h2>{method==="bank_transfer"?"Bank transfer details":"Crypto payment details"}</h2><p>{detailsReady ? "Use only the payment details shown for this booking reference." : "Your booking team will add the payment details to this request. Do not send money until they appear here."}</p></div></div>
          {detailsReady ? <div className="pay-details">
            {method==="bank_transfer" ? <>
              <div><span>Account name</span><strong>{ticket.payment_account_name||"Not provided"}</strong>{ticket.payment_account_name&&<button type="button" onClick={()=>void copy(ticket.payment_account_name,"account name")}><Copy size={14}/>{copied==="account name"?"Copied":"Copy"}</button>}</div>
              <div><span>Bank</span><strong>{ticket.payment_bank||"Not provided"}</strong>{ticket.payment_bank&&<button type="button" onClick={()=>void copy(ticket.payment_bank,"bank")}><Copy size={14}/>{copied==="bank"?"Copied":"Copy"}</button>}</div>
              <div><span>Account number</span><strong>{ticket.payment_account_number||"Not provided"}</strong>{ticket.payment_account_number&&<button type="button" onClick={()=>void copy(ticket.payment_account_number,"account")}><Copy size={14}/>{copied==="account"?"Copied":"Copy"}</button>}</div>
            </> : <>
              <div><span>Coin / asset</span><strong>{ticket.payment_account_name||"Not provided"}</strong>{ticket.payment_account_name&&<button type="button" onClick={()=>void copy(ticket.payment_account_name,"asset")}><Copy size={14}/>{copied==="asset"?"Copied":"Copy"}</button>}</div>
              <div><span>Network</span><strong>{ticket.payment_bank||"Not provided"}</strong>{ticket.payment_bank&&<button type="button" onClick={()=>void copy(ticket.payment_bank,"network")}><Copy size={14}/>{copied==="network"?"Copied":"Copy"}</button>}</div>
              <div className="pay-wallet"><span>Wallet address</span><strong>{ticket.payment_account_number||"Not provided"}</strong>{ticket.payment_account_number&&<button type="button" onClick={()=>void copy(ticket.payment_account_number,"wallet")}><Copy size={14}/>{copied==="wallet"?"Copied":"Copy"}</button>}</div>
            </>}
            <div className="pay-amount"><span>Amount to pay</span><strong>{price(Number(ticket.ticket_amount),ticket.currency)}</strong></div>
            {ticket.payment_instructions&&<div className="pay-instructions"><span>Additional instructions</span><p>{ticket.payment_instructions}</p></div>}
          </div> : <div className="pay-waiting"><Clock3 size={21}/><div><strong>Payment details are being prepared</strong><p>Keep this booking reference. Refresh this page in a moment or contact support if you need help.</p><button type="button" onClick={()=>void load()}>Refresh payment details</button></div></div>}
          {ticket.payment_deadline_at && <div className={"pay-deadline"+(isExpired?" expired":"")}><Clock3 size={18}/><div><strong>{isExpired?"Payment window expired":"Payment must be completed within 30 minutes"}</strong><p>{remaining!==null && !isExpired ? "Time remaining: "+Math.floor(remaining/60000)+"m "+Math.floor((remaining%60000)/1000)+"s" : isExpired ? "Contact support for updated instructions. Do not send funds using expired details." : "The timer starts when the booking team issues payment details."}</p></div></div>}
        </section>
        {detailsReady && !isExpired && <section className="pay-panel"><div className="pay-section-title"><span>3</span><div><h2>Upload payment receipt</h2><p>Accepted: JPG, PNG, WEBP or PDF · maximum 10 MB.</p></div></div><form className="pay-receipt-form" onSubmit={submitReceipt}><label>Transfer / transaction reference<input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Enter the transaction reference"/></label><label className="pay-file"><UploadCloud size={20}/><span>{file?file.name:"Choose receipt file"}</span><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="pay-primary" disabled={uploading||!file}>{uploading?"Uploading receipt…":"Submit receipt for review"} <ArrowRight size={16}/></button><p className="pay-disclaimer"><ShieldCheck size={15}/> Uploading a receipt does not automatically confirm payment. The booking team must verify it.</p></form></section>}
      </>}
      <div className="pay-support"><Headphones size={20}/><div><strong>Need payment support?</strong><p>Contact the booking team if details are missing, a payment window expires, or you selected the wrong method.</p><Link href="/support">Contact support <ArrowRight size={14}/></Link></div></div>
    </> : null}
  </div></main><style jsx>{`
    .pay-page{min-height:65vh;background:#f6f8fb;padding:38px 0 80px;color:#13283d}.pay-container{max-width:900px}.pay-back{display:inline-flex;align-items:center;gap:8px;color:#50657b;font-size:13px;font-weight:700;margin-bottom:25px}.pay-heading{margin-bottom:26px}.pay-kicker{display:inline-flex;align-items:center;gap:7px;color:#176b5b;font-size:11px;letter-spacing:.12em;font-weight:800}.pay-heading h1{font-size:clamp(32px,5vw,48px);letter-spacing:-1.5px;margin:10px 0}.pay-heading h1 em{font-style:normal;color:#126b5b}.pay-heading p{max-width:650px;color:#627489;line-height:1.7}.pay-summary{display:grid;grid-template-columns:1fr auto;gap:18px;background:#102b2b;color:#fff;border-radius:16px;padding:22px;margin-bottom:18px}.pay-summary>div{display:flex;flex-direction:column;gap:6px}.pay-summary strong{font-size:20px;overflow-wrap:anywhere}.pay-summary small{color:#d0dfdc}.pay-label{font-size:10px;letter-spacing:.12em;color:#b4cbc4;font-weight:800}.pay-panel{background:#fff;border:1px solid #e1e8ee;border-radius:16px;padding:22px;margin:16px 0;box-shadow:0 8px 24px #18304708}.pay-section-title{display:flex;gap:12px;align-items:flex-start;margin-bottom:20px}.pay-section-title>span{width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:10px;background:#e7f3ee;color:#126b5b;font-weight:800}.pay-section-title h2{font-size:18px;margin:2px 0 5px}.pay-section-title p,.pay-muted{color:#6a7b8e;font-size:13px;margin:0;line-height:1.6}.pay-methods{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pay-method{border:1px solid #dbe4e9;background:#fff;border-radius:13px;padding:16px;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;color:#183047;min-width:0}.pay-method.selected{border-color:#16806a;background:#f2faf6;box-shadow:0 0 0 2px #16806a14}.pay-method:disabled{opacity:.6;cursor:not-allowed}.pay-method-icon{width:42px;height:42px;display:grid;place-items:center;flex:none;border-radius:12px;background:#e8f3ef;color:#126b5b}.pay-method>span:nth-child(2){display:flex;flex-direction:column;gap:5px;min-width:0}.pay-method strong{font-size:14px}.pay-method small{font-size:11px;color:#6c7c8e;line-height:1.5}.pay-radio{margin-left:auto;flex:none;width:21px;height:21px;border:1px solid #b8c8ce;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:12px}.selected .pay-radio{background:#126b5b;border-color:#126b5b}.pay-details{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pay-details>div{position:relative;padding:13px;background:#f7f9fb;border:1px solid #e7edf1;border-radius:10px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}.pay-details span{font-size:11px;color:#64768a}.pay-details strong{font-size:14px;overflow-wrap:anywhere;line-height:1.5}.pay-details button{display:inline-flex;align-items:center;gap:5px;border:0;background:#e7f3ee;color:#126b5b;border-radius:7px;padding:6px 9px;font-size:11px;font-weight:800;cursor:pointer}.pay-details .pay-wallet,.pay-details .pay-amount,.pay-details .pay-instructions{grid-column:1/-1}.pay-details .pay-amount{background:#eef8f2;border-color:#d2e9dc}.pay-details .pay-amount strong{font-size:20px;color:#126b5b}.pay-instructions p{margin:0;white-space:pre-wrap;line-height:1.7;font-size:13px}.pay-waiting{display:flex;gap:12px;align-items:flex-start;padding:16px;background:#f5f8fb;border-radius:12px;color:#456078}.pay-waiting strong{display:block;color:#19384e}.pay-waiting p{font-size:12px;line-height:1.6;margin:5px 0 12px}.pay-waiting button{border:1px solid #cad7df;background:#fff;border-radius:8px;padding:8px 11px;font-weight:700;cursor:pointer}.pay-deadline{display:flex;gap:11px;align-items:center;background:#fff8e8;color:#7c5311;border:1px solid #f0dcae;border-radius:10px;padding:13px;margin-top:14px}.pay-deadline.expired{background:#fff0f0;color:#a52828;border-color:#efcaca}.pay-deadline strong{font-size:13px}.pay-deadline p{font-size:12px;margin:4px 0 0;line-height:1.5}.pay-receipt-form{display:grid;gap:14px}.pay-receipt-form>label:first-child{display:grid;gap:7px;font-size:12px;font-weight:700}.pay-receipt-form input:not([type=file]){padding:12px;border:1px solid #d7e0e7;border-radius:9px;width:100%;margin-top:7px}.pay-file{border:1px dashed #b7c8d1;border-radius:11px;padding:16px;display:flex;align-items:center;gap:10px;cursor:pointer;color:#34576c;overflow:hidden}.pay-file span{overflow-wrap:anywhere;font-size:13px}.pay-file input{width:100%;max-width:200px;font-size:11px;margin-left:auto}.pay-primary{display:inline-flex;justify-content:center;align-items:center;gap:8px;background:#126b5b;color:#fff;border:0;border-radius:10px;padding:14px 18px;font-weight:800;cursor:pointer}.pay-primary:disabled{opacity:.6;cursor:not-allowed}.pay-disclaimer{display:flex;gap:7px;align-items:flex-start;color:#64768a;font-size:11px;line-height:1.6;margin:0}.pay-disclaimer svg{flex:none}.pay-alert{padding:12px 14px;border-radius:10px;margin:14px 0;display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.6}.pay-error{background:#fff0f0;color:#9c2525}.pay-success{background:#eaf8ef;color:#17643b}.pay-alert p{margin:7px 0 0}.pay-review{display:flex;gap:12px;align-items:flex-start;background:#eaf8ef;color:#17643b;border:1px solid #c8e8d3;padding:18px;border-radius:12px;margin:16px 0}.pay-review p{margin:5px 0 0;font-size:13px;line-height:1.6}.pay-support{display:flex;gap:14px;padding:20px 4px;color:#456078}.pay-support>svg{flex:none;color:#126b5b}.pay-support strong{color:#183047}.pay-support p{font-size:12px;line-height:1.6;margin:5px 0 9px}.pay-support a{display:inline-flex;align-items:center;gap:5px;color:#126b5b;font-size:12px;font-weight:800}.pay-loading{display:flex;gap:10px;align-items:center;color:#63778a}.pay-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:640px){.pay-page{padding-top:24px}.pay-summary{grid-template-columns:1fr;padding:18px}.pay-panel{padding:16px}.pay-methods,.pay-details{grid-template-columns:1fr}.pay-method{padding:13px}.pay-details .pay-wallet,.pay-details .pay-amount,.pay-details .pay-instructions{grid-column:auto}.pay-file{flex-wrap:wrap}.pay-file input{max-width:100%;margin-left:0}}
  `}</style></main></TravelShell>;
}
