"use client";
import {useEffect} from "react";
declare global {
 interface Window {
  google?: {translate?:{TranslateElement:new(options:Record<string,unknown>,element:string)=>unknown}};
  googleTranslateElementInit?:()=>void;
 }
}
const LANGUAGES=["en","pt","es","fr","de","ar"];
function selectedLanguage(){
 try{const value=localStorage.getItem("book-vacation-language")||"en";return LANGUAGES.includes(value)?value:"en"}catch{return "en"}
}
export default function SiteTranslation(){
 useEffect(()=>{
  let timer:ReturnType<typeof setInterval>|undefined;
  const apply=()=>{
   const language=selectedLanguage();
   if(language==="en")return true;
   const select=document.querySelector<HTMLSelectElement>(".goog-te-combo");
   if(!select)return false;
   if(select.value!==language){select.value=language;select.dispatchEvent(new Event("change",{bubbles:true}))}
   return true;
  };
  const poll=()=>{
   if(timer)clearInterval(timer);
   let attempts=0;
   timer=setInterval(()=>{attempts++;if(apply()||attempts>40){if(timer)clearInterval(timer)}},250);
  };
  window.googleTranslateElementInit=()=>{
   if(window.google?.translate?.TranslateElement){
    new window.google.translate.TranslateElement({pageLanguage:"en",includedLanguages:"en,pt,es,fr,de,ar",autoDisplay:false},"book-vacation-translate");
    poll();
   }
  };
  if(window.google?.translate?.TranslateElement)window.googleTranslateElementInit();
  else if(!document.querySelector('script[data-book-vacation-translate="true"]')){
   const script=document.createElement("script");
   script.src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
   script.async=true;script.dataset.bookVacationTranslate="true";document.head.appendChild(script);
  }else poll();
  try{
   const language=selectedLanguage();
   document.cookie=language==="en"?"googtrans=;path=/;max-age=0":"googtrans=/en/"+language+";path=/;max-age=31536000;SameSite=Lax";
  }catch{}
  return()=>{if(timer)clearInterval(timer)};
 },[]);
 return <div id="book-vacation-translate" aria-hidden="true"/>;
}