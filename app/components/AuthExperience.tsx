"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Globe2, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCurrency } from "./CurrencyProvider";
import { TravelFooter, TravelHeader } from "./TravelShell";
type AuthMode = "signup" | "login" | "verify";
export default function AuthExperience({mode}:{mode:AuthMode}) {
 const router=useRouter(); const {currency,setCurrency}=useCurrency();
 const [name,setName]=useState(""); const [country,setCountry]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [code,setCode]=useState(""); const [showPassword,setShowPassword]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
 useEffect(()=>{try{setEmail(localStorage.getItem("book-vacation-pending-email")||"")}catch{} let alive=true;supabase.auth.getSession().then(({data})=>{if(alive&&data.session&&mode!=="signup")router.replace("/account")});return()=>{alive=false}},[mode,router]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setMessage("");try{
 if(mode==="signup"){const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim(),country_of_residence:country.trim(),preferred_currency:currency},emailRedirectTo:window.location.origin+"/verify"}});if(error)throw error;if(data.session){router.push("/account");return}try{localStorage.setItem("book-vacation-pending-email",email.trim())}catch{}router.push("/verify");return}
 if(mode==="login"){const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;const preferred=data.user.user_metadata?.preferred_currency;if(typeof preferred==="stri...[truncated]