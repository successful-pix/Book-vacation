"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,CalendarDays,Clock3,Plane,RefreshCw,TicketCheck,UserRound,ShieldCheck} from "lucide-react";
import {TravelShell} from "../components/TravelShell";
import {supabase} from "../lib/supabase";
type HistoryRow={booking_reference:string;guest_access_token?:string;origin:string;destination:string;departure_date:string;return_date?:string|null;status:string;payment_status?:string;ticket_number?:string|null;created_at:string};
function localHistory():HistoryRow[]{try{const raw=localStorage.getItem("book-vacation-ticket-history");const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed.filter((x:any)=>x&&x.booking_reference&&x.guest_access_token):[]}catch{return []}}
export default function RequestHistoryPage(){
 const [user,setUser]=useState<{id:string;email?:string}|null>(null);
 const [rows,setRows]=useState<HistoryRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [guestRef,setGuestRef]=useState("");
 const [guestToken,setGuestToken]=useState("");
 useEffect(()=>{
  let active=true;
  const load=async()=>{
   const local=localHistory();
   const {data:{session}}=await supabase.auth.getSession();
   if(!active)return;
   const current=session?.user?{id:session.user.id,email:session.user.email}:null;setUser(current);
   if(current){
    const {data,error}=await supabase.from("ticket_requests").select("booking_reference,guest_access_token,origin,destination,departure_date,return_date,status,payment_status,ticket_number,created_at").eq("customer_user_id",current.id).order("created_at",{ascending:false});
    if(!active)return;
    if(error)setError(error.message);else{
     const byRef=new Map(local.map(x=>[x.booking_reference,x]));
     const combined=(data||[]).map((x:any)=>({...x,guest_access_token:x.guest_access_token||byRef.get(x.booking_reference)?.guest_access_token||""})) as HistoryRow[];
     const refs=new Set(combined.map(x=>x.booking_reference));
     setRows([...combined,...local.filter(x=>!refs.has(x.booking_reference))].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));
    }
   }else setRows(local);
   setLoading(false);
  };
  void load();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void load()});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 const openTicket=(row:HistoryRow)=>row.guest_access_token?"/tickets?reference="+encodeURIComponent(row.booking_reference)+"&access="+encodeURIComponent(row.guest_access_token):"/tickets?reference="+encodeURIComponent(row.booking_reference);
 return <TravelShell><main className="history-page"><section className="history-hero"><div className="container"><div className="travel-kicker"><CalendarDays size={15}/> YOUR TRAVEL REQUESTS</div><h1>Request history<br/><em>all in one place.</em></h1><p>Review the ticket requests you have submitted, check their status and return to the private tracker whenever you need it.</p><div className="history-hero-actions"><Link href="/tickets" className="travel-search-button"><Plane size={17}/> Request a ticket</Link><Link href="/support" className="history-secondary-button">Ask support <ArrowRight size={15}/></Link></div></div></section>
 <section className="container history-content"><div className="history-heading"><div><div className="travel-kicker">{user?"CUSTOMER HISTORY":"GUEST HISTORY"}</div><h2>{loading?"Loading your requests…":rows.length?rows.length+" ticket request"+(rows.length===1?"":"s"):"No requests saved yet"}</h2><p>{user?"Your account requests are combined with ticket requests saved on this device.":"Guest history is saved on this device. Keep each booking reference and private access code safe to track requests on another device."}</p></div><span className="history-shield"><ShieldCheck size={23}/></span></div>
 {error&&<p className="ticket-error" role="alert">{error}</p>}
 {loading?<div className="history-empty"><RefreshCw size={22}/><p>Loading request history…</p></div>:rows.length?<div className="history-list">{rows.map(row=><article className="history-row" key={row.booking_reference}><span className="history-row-icon"><TicketCheck size={21}/></span><div className="history-row-main"><div className="history-ref">{row.booking_reference}</div><strong>{row.origin} <ArrowRight size={14}/> {row.destination}</strong><small><CalendarDays size={13}/> {row.departure_date}{row.return_date?" → "+row.return_date:""} · <Clock3 size={13}/> {new Date(row.created_at).toLocaleDateString()}</small>{row.ticket_number&&<small>Issued ticket number: {row.ticket_number}</small>}</div><div className="history-row-status"><span className={"history-status status-"+row.status}>{row.status.replaceAll("_"," ")}</span><Link href={openTicket(row)} className="history-open-link">Track request <ArrowRight size={14}/></Link></div></article>)}</div>:<div className="history-empty"><TicketCheck size={30}/><h3>Your request history will appear here</h3><p>Submit a ticket request as a guest or while signed in. Your booking reference and private access code let you return to the tracker.</p><Link href="/tickets" className="travel-search-button">Request or track a ticket <ArrowRight size={15}/></Link></div>}
 {!user&&<section className="history-guest-lookup"><div><div className="travel-kicker">TRACK FROM ANY DEVICE</div><h3>Already have a booking reference?</h3><p>Enter your reference and private access code to open the ticket tracker securely.</p></div><form onSubmit={e=>{e.preventDefault();window.location.assign("/tickets?reference="+encodeURIComponent(guestRef.trim().toUpperCase())+"&access="+encodeURIComponent(guestToken.trim()))}}><label>Booking reference<input required value={guestRef} onChange={e=>setGuestRef(e.target.value.toUpperCase())} placeholder="BVT-XXXXXXXXXX"/></label><label>Private access code<input required value={guestToken} onChange={e=>setGuestToken(e.target.value)} placeholder="Private access code"/></label><button className="travel-search-button">Find my request <ArrowRight size={15}/></button></form></section>}
 <div className="history-help-strip"><UserRound size={18}/><p>{user?"Need help with a payment or request?":"Want your travel plans saved to your account?"}</p><Link href={user?"/support":"/signup"}>{user?"Chat with support":"Create an account"} <ArrowRight size={14}/></Link></div>
 </section></main></TravelShell>
}
