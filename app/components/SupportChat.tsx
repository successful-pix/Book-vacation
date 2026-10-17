"use client";
import {FormEvent,useCallback,useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowRight,CheckCircle2,Clock3,Headphones,LockKeyhole,MessageCircle,RefreshCw,Send,ShieldCheck,UserRound} from "lucide-react";
import {supabase} from "../lib/supabase";
type Conversation={id:string;conversation_reference:string;customer_user_id:string|null;guest_access_token:string;customer_name:string;customer_email:string;subject:string;status:string;created_at:string};
type ChatMessage={id:string;conversation_id:string;sender_user_id:string|null;sender_type:"customer"|"agent";body:string;created_at:string};
const apiUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://sakvxjyemhvzetlxhucd.supabase.co";
const apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";
function readSaved():Conversation[]{try{const value=JSON.parse(localStorage.getItem("book-vacation-support-conversations")||"[]");return Array.isArray(value)?value.filter((x:any)=>x?.id&&x?.guest_access_token):[]}catch{return []}}
function saveConversation(conversation:Conversation){try{const previous=readSaved().filter(x=>x.id!==conversation.id);localStorage.setItem("book-vacation-support-conversations",JSON.stringify([conversation,...previous].slice(0,25)))}catch{}}
async function supportClient(token:string,session?:{access_token:string;refresh_token:string}|null){const client=createClient(apiUrl,apiKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{"x-support-access-token":token||crypto.randomUUID()}}});if(session)await client.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});return client}
export default function SupportChat(){
 const [conversations,setConversations]=useState<Conversation[]>([]);
 const [active,setActive]=useState<Conversation|null>(null);
 const [messages,setMessages]=useState<ChatMessage[]>([]);
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [subject,setSubject]=useState("Payment assistance");const [firstMessage,setFirstMessage]=useState("");
 const [reply,setReply]=useState("");const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
 const refreshConversations=useCallback(async()=>{
  setError("");
  try{
   const saved=readSaved();
   const {data:{session}}=await supabase.auth.getSession();
   let list=saved;
   if(session?.user){
    const {data,error}=await supabase.from("support_conversations").select("*").eq("customer_user_id",session.user.id).order("created_at",{ascending:false});
    if(error)throw error;
    const localById=new Map(saved.map(x=>[x.id,x]));
    const remote=(data||[]).map((x:any)=>({...x,guest_access_token:x.guest_access_token||localById.get(x.id)?.guest_access_token||""})) as Conversation[];
    const ids=new Set(remote.map(x=>x.id));list=[...remote,...saved.filter(x=>!ids.has(x.id))];
    remote.forEach(saveConversation);
   }
   setConversations(list);
   if(!active&&list.length){const preferred=(()=>{try{return localStorage.getItem("book-vacation-support-active")}catch{return null}})();setActive(list.find(x=>x.id===preferred)||list[0])}
   if(!name&&session?.user){setName(String(session.user.user_metadata?.full_name||""));setEmail(session.user.email||"")}
  }catch(e){setError(e instanceof Error?e.message:"We couldn't load your support conversations. Please try again.")}finally{setLoading(false)}
 },[active,name]);
 useEffect(()=>{void refreshConversations()},[refreshConversations]);
 const loadMessages=useCallback(async(conversation:Conversation)=>{
  try{const {data:{session}}=await supabase.auth.getSession();const client=await supportClient(conversation.guest_access_token,session);const {data,error}=await client.from("support_messages").select("id,conversation_id,sender_user_id,sender_type,body,created_at").eq("conversation_id",conversation.id).order("created_at",{ascending:true});if(error)throw error;setMessages((data||[]) as ChatMessage[])}catch(e){setError(e instanceof Error?e.message:"Messages couldn't be loaded. Reopen the conversation and try again.")}
 },[]);
 useEffect(()=>{if(!active){setMessages([]);return}try{localStorage.setItem("book-vacation-support-active",active.id)}catch{}void loadMessages(active);const timer=window.setInterval(()=>void loadMessages(active),8000);return()=>window.clearInterval(timer)},[active,loadMessages]);
 async function startConversation(e:FormEvent){e.preventDefault();setBusy(true);setError("");setNotice("");try{
  const {data:{session}}=await supabase.auth.getSession();const token=crypto.randomUUID();const client=await supportClient(token,session);
  const {data,error}=await client.from("support_conversations").insert({customer_user_id:session?.user.id||null,guest_access_token:token,customer_name:name.trim(),customer_email:email.trim(),subject:subject.trim()}).select("*").single();
  if(error)throw error;const conversation=data as Conversation;
  const {error:messageError}=await client.from("support_messages").insert({conversation_id:conversation.id,sender_user_id:session?.user.id||null,sender_type:"customer",body:firstMessage.trim()});
  if(messageError)throw messageError;
  saveConversation(conversation);setConversations(old=>[conversation,...old.filter(x=>x.id!==conversation.id)]);setActive(conversation);setFirstMessage("");setNotice("Your support conversation has been opened. Keep the reference and private access code safe.");
 }catch(e){setError(e instanceof Error?e.message:"We couldn't start your support conversation. Please try again.")}finally{setBusy(false)}}
 async function sendReply(e:FormEvent){e.preventDefault();if(!active||!reply.trim())return;setBusy(true);setError("");try{
  const {data:{session}}=await supabase.auth.getSession();const client=await supportClient(active.guest_access_token,session);
  const senderId=active.customer_user_id?session?.user.id||null:null;
  const {error}=await client.from("support_messages").insert({conversation_id:active.id,sender_user_id:senderId,sender_type:"customer",body:reply.trim()});
  if(error)throw error;setReply("");await loadMessages(active);
 }catch(e){setError(e instanceof Error?e.message:"Your reply couldn't be sent. Please try again.")}finally{setBusy(false)}}
 const canStart=useMemo(()=>name.trim().length>=2&&email.includes("@")&&subject.trim().length>=3&&firstMessage.trim().length>=2,[name,email,subject,firstMessage]);
 return <section className="support-chat-shell" id="support-chat"><div className="support-chat-intro"><span className="support-chat-icon"><Headphones size={22}/></span><div><div className="travel-kicker">PERSONAL SUPPORT</div><h2>Chat with our support team</h2><p>Ask about payment instructions, ticket requests, booking status or account help. You can start as a guest—no account required.</p></div></div>
 {error&&<p className="support-chat-error" role="alert">{error}</p>}{notice&&<p className="support-chat-notice" role="status"><CheckCircle2 size={16}/>{notice}</p>}
 <div className="support-chat-layout"><aside className="support-chat-sidebar"><div className="support-chat-sidebar-head"><strong>Your conversations</strong><button type="button" onClick={()=>void refreshConversations()} aria-label="Refresh conversations"><RefreshCw size={15}/></button></div>{loading?<p className="support-chat-muted">Loading conversations…</p>:conversations.length?conversations.map(c=><button type="button" key={c.id} className={"support-conversation-choice"+(active?.id===c.id?" active":"")} onClick={()=>setActive(c)}><span className="support-conversation-icon"><MessageCircle size={17}/></span><span><strong>{c.subject}</strong><small>{c.conversation_reference}</small><small>{c.status.replaceAll("_"," ")}</small></span></button>):<p className="support-chat-muted">Your conversations will appear here.</p>}<div className="support-chat-private-note"><LockKeyhole size={15}/><span>Conversations are private to you and the support team.</span></div></aside>
 <div className="support-chat-main">{active?<><div className="support-chat-thread-head"><div><div className="travel-kicker">CONVERSATION REFERENCE</div><h3>{active.conversation_reference}</h3><p>{active.subject}</p></div><span className={"support-thread-status status-"+active.status}>{active.status.replaceAll("_"," ")}</span></div><div className="support-chat-access"><ShieldCheck size={15}/><span>Private access code: <code>{active.guest_access_token}</code></span></div><div className="support-chat-messages">{messages.length?messages.map(m=><article key={m.id} className={"support-message "+(m.sender_type==="agent"?"from-agent":"from-customer")}><span className="support-message-avatar">{m.sender_type==="agent"?<Headphones size={15}/>:<UserRound size={15}/>}</span><div className="support-message-bubble"><strong>{m.sender_type==="agent"?"Book Vacation Support":"You"}</strong><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString()}</small></div></article>):<div className="support-chat-muted">Messages will appear here.</div>}</div>{active.status==="closed"||active.status==="resolved"?<div className="support-chat-closed"><CheckCircle2 size={17}/> This conversation is marked {active.status}. Start a new conversation if you still need help.</div>:<form className="support-chat-reply" onSubmit={sendReply}><textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} maxLength={5000} placeholder="Write your message…" required/><button className="travel-search-button" disabled={busy||!reply.trim()}>{busy?"Sending…":"Send message"} <Send size={15}/></button></form>}</>:<div className="support-chat-new"><span className="support-new-icon"><MessageCircle size={25}/></span><h3>How can we help?</h3><p>Start a private conversation about a payment, ticket request or any other travel question.</p><form className="support-chat-start-form" onSubmit={startConversation}><label>Your full name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={160} autoComplete="name" required placeholder="Full name"/></label><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={320} autoComplete="email" required placeholder="you@example.com"/></label><label>What do you need help with?<select value={subject} onChange={e=>setSubject(e.target.value)}><option>Payment assistance</option><option>Ticket request or booking status</option><option>Upload payment receipt</option><option>Account help</option><option>Other travel question</option></select></label><label>Your message<textarea value={firstMessage} onChange={e=>setFirstMessage(e.target.value)} rows={4} maxLength={5000} required placeholder="Tell us how we can help…"/></label><button className="travel-search-button" disabled={busy||!canStart}>{busy?"Opening conversation…":"Start conversation"} <ArrowRight size={16}/></button><p className="support-chat-small-note"><LockKeyhole size={14}/> Your conversation reference and private code will be saved on this device.</p></form></div>}</div></div>
 <div className="support-chat-bottom-note"><Clock3 size={16}/> Send a message anytime. A support agent can reply through this chat when available.</div></section>;
}
