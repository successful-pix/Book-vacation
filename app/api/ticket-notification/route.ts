import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://sakvxjyemhvzetlxhucd.supabase.co";
const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";
const esc=(value:unknown)=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const money=(amount:number,currency:string)=>{try{return new Intl.NumberFormat("en",{style:"currency",currency,maximumFractionDigits:0}).format(amount)}catch{return currency+" "+amount}};
export async function POST(request:Request){
 try{
  const body=await request.json() as {requestId?:string;accessToken?:string;event?:string};
  const requestId=String(body.requestId||"");const token=String(body.accessToken||"");const event=String(body.event||"");
  if(!/^[0-9a-f-]{36}$/i.test(requestId)||!/^[0-9a-f-]{36}$/i.test(token)||!["request-received","payment-details","receipt-submitted","payment-approved","payment-rejected"].includes(event))return NextResponse.json({error:"Invalid notification request."},{status:400});
  const client=createClient(supabaseUrl,supabaseKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{"x-ticket-access-token":token}}});
  const {data:ticket,error}=await client.from("ticket_requests").select("id,booking_reference,guest_access_token,customer_name,customer_email,customer_phone,country_name,origin,destination,trip_type,departure_date,return_date,travellers_count,cabin_class,ticket_amount,currency,status,payment_status,payment_account_name,payment_bank,payment_account_number,payment_instructions,ticket_details,operations_note").eq("id",requestId).single();
  if(error||!ticket||String(ticket.guest_access_token)!==token)return NextResponse.json({error:"Booking request not found."},{status:404});
  const apiKey=process.env.RESEND_API_KEY;const from=process.env.RESEND_FROM_EMAIL;const notifyTo=process.env.BOOKING_NOTIFICATION_EMAIL;
  if(!apiKey||!from||!notifyTo)return NextResponse.json({sent:false,configured:false,missing:["RESEND_API_KEY","RESEND_FROM_EMAIL","BOOKING_NOTIFICATION_EMAIL"].filter(k=>!process.env[k])});
  const titles:Record<string,string>={"request-received":"We received your ticket request","payment-details":"Your ticket payment details are ready","receipt-submitted":"Payment receipt received","payment-approved":"Your payment has been approved","payment-rejected":"Your payment receipt needs attention"};
  const title=titles[event];const link="https://book-vacation.vercel.app/tickets?reference="+encodeURIComponent(ticket.booking_reference)+"&access="+encodeURIComponent(token);
  const route=esc(ticket.origin)+" → "+esc(ticket.destination);const price=money(Number(ticket.ticket_amount),ticket.currency);
  let detail="";
  if(event==="payment-details")detail="<h3>Payment details</h3><p><b>Account name:</b> "+esc(ticket.payment_account_name)+"<br/><b>Bank:</b> "+esc(ticket.payment_bank)+"<br/><b>Account number:</b> "+esc(ticket.payment_account_number)+"</p><p>"+esc(ticket.payment_instructions)+"</p>";
  if(event==="payment-approved")detail="<h3>Payment approved</h3><p>"+esc(ticket.ticket_details||"Your payment has been approved. Your booking details will be shown in your request tracker.")+"</p>";
  if(event==="payment-rejected")detail="<p>"+esc(ticket.operations_note||"Please review the receipt and submit a clearer copy if needed.")+"</p>";
  if(event==="receipt-submitted")detail="<p>Your receipt has been received and is waiting for verification. A receipt upload does not by itself confirm a ticket.</p>";
  if(event==="request-received")detail="<p>Your request has been recorded. Please wait for the payment instructions to be provided before transferring money.</p>";
  const html="<div style='font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#142b3d'><h2 style='color:#0756c8'>Book Vacation</h2><h1>"+esc(title)+"</h1><p>Hello "+esc(ticket.customer_name)+",</p><p><b>Reference:</b> "+esc(ticket.booking_reference)+"<br/><b>Route:</b> "+route+"<br/><b>Trip:</b> "+esc(ticket.trip_type==="oneway"?"One way":"Return")+"<br/><b>Departure:</b> "+esc(ticket.departure_date)+(ticket.return_date?"<br/><b>Return:</b> "+esc(ticket.return_date):"")+"<br/><b>Travellers:</b> "+esc(ticket.travellers_count)+"<br/><b>Request price:</b> "+esc(price)+"</p>"+detail+"<p><a href='"+esc(link)+"' style='display:inline-block;background:#0756c8;color:white;text-decoration:none;padding:12px 18px;border-radius:8px'>View your ticket request</a></p><p style='color:#667788;font-size:12px'>Prices and availability are confirmed before a ticket is issued. Keep your private access link secure.</p></div>";
  const text=[title,"Hello "+ticket.customer_name,"Reference: "+ticket.booking_reference,"Route: "+ticket.origin+" to "+ticket.destination,"Trip: "+ticket.trip_type,"Departure: "+ticket.departure_date,"Amount: "+price, event==="payment-details"?"Account name: "+ticket.payment_account_name+"\nBank: "+ticket.payment_bank+"\nAccount number: "+ticket.payment_account_number+"\nInstructions: "+ticket.payment_instructions:"",event==="payment-approved"?"Booking details: "+ticket.ticket_details:"","Track your request: "+link].filter(Boolean).join("\n");
  const recipients=Array.from(new Set([ticket.customer_email,notifyTo].filter(Boolean)));
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:recipients,subject:title+" · "+ticket.booking_reference,html,text})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)return NextResponse.json({sent:false,error:"Email provider rejected the message.",details:result},{status:502});
  return NextResponse.json({sent:true,id:result.id});
 }catch{return NextResponse.json({error:"Unable to send the booking notification."},{status:500})}
}