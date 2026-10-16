"use client";
import {useEffect} from "react";

export default function DisplayScale(){
  useEffect(()=>{
    const apply=()=>{
      let scale="85";
      try { scale=localStorage.getItem("book-vacation-display-scale")||"85"; } catch {}
      const value=Number(scale);
      const safe=Number.isFinite(value)&&value>=70&&value<=125?value:85;
      // Font scaling preserves responsive breakpoints and avoids zoom-induced overlaps.
      document.documentElement.style.zoom="";
      document.documentElement.style.fontSize=safe+"%";
      document.documentElement.dataset.displayScale=String(safe);
    };
    apply();
    window.addEventListener("storage",apply);
    return ()=>window.removeEventListener("storage",apply);
  },[]);
  return null;
}
