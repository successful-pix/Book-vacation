"use client";
import {useEffect} from "react";

declare global {
  interface Window {
    google?: { translate?: { TranslateElement: new (options: Record<string, unknown>, element: string) => unknown } };
    googleTranslateElementInit?: () => void;
  }
}

export default function SiteTranslation(){
  useEffect(()=>{
    const selected=(()=>{try{return localStorage.getItem("book-vacation-language")||"en"}catch{return "en"}})();
    if(selected==="en") return;
    if(document.querySelector('script[data-book-vacation-translate="true"]')) return;
    window.googleTranslateElementInit=()=>{
      if(window.google?.translate?.TranslateElement){
        new window.google.translate.TranslateElement({pageLanguage:"en",includedLanguages:"en,pt,es,fr,de,ar",autoDisplay:false}, "book-vacation-translate");
      }
    };
    const script=document.createElement("script");
    script.src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async=true;
    script.dataset.bookVacationTranslate="true";
    document.body.appendChild(script);
  },[]);
  return <div id="book-vacation-translate" aria-hidden="true" style={{position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)"}}/>;
}
