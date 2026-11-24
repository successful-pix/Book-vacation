"use client";

import Link from "next/link";
import {useEffect} from "react";
import {Headphones,RefreshCw} from "lucide-react";

export default function SupportError({error,reset}:{error:Error&{digest?:string};reset:()=>void}) {
  useEffect(()=>{console.error("Book Vacation support page failed to load:",error)},[error]);
  return <main className="support-page-error">
    <div className="support-page-error-card">
      <span><Headphones size={24}/></span>
      <h1>Support chat is temporarily unavailable</h1>
      <p>We’re sorry. The support page did not load correctly. Your existing booking and support messages have not been deleted.</p>
      <div><button type="button" onClick={()=>reset()}><RefreshCw size={16}/> Try again</button><Link href="/tickets">View my booking</Link><Link href="/">Back to home</Link></div>
    </div>
  </main>;
}
