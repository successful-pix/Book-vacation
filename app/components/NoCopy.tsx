"use client";
import { useEffect } from "react";

export default function NoCopy(){
 useEffect(()=>{
  const editable=(target:EventTarget|null)=>target instanceof HTMLElement && !!target.closest("input,textarea,[contenteditable='true']");
  const block=(event:Event)=>{if(!editable(event.target))event.preventDefault()};
  const keys=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&["c","x","a"].includes(event.key.toLowerCase())&&!editable(event.target)){event.preventDefault();event.stopPropagation()}};
  const selection=(event:Event)=>{if(!editable(event.target))event.preventDefault()};
  document.addEventListener("copy",block,true);
  document.addEventListener("cut",block,true);
  document.addEventListener("contextmenu",block,true);
  document.addEventListener("dragstart",block,true);
  document.addEventListener("selectstart",selection,true);
  document.addEventListener("keydown",keys,true);
  return()=>{document.removeEventListener("copy",block,true);document.removeEventListener("cut",block,true);document.removeEventListener("contextmenu",block,true);document.removeEventListener("dragstart",block,true);document.removeEventListener("selectstart",selection,true);document.removeEventListener("keydown",keys,true)};
 },[]);
 return null;
}