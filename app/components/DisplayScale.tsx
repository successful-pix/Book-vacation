"use client";
import {useEffect} from "react";
export default function DisplayScale(){
 useEffect(()=>{
  const apply=()=>{
   let scale="85";
   try{scale=localStorage.getItem("book-vacation-display-scale")||"85"}catch{}
   const n=Number(scale),safe=Number.isFinite(n)&&n>=70&&n<=125?n:85;
   document.documentElement.style.zoom="";
   document.documentElement.style.fontSize=safe+"%";
   document.documentElement.dataset.displayScale=String(safe);
  };
  apply();window.addEventListener("storage",apply);
  return()=>window.removeEventListener("storage",apply);
 },[]);
 return null;
}