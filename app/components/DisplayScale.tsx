"use client";
import {useEffect} from "react";

export default function DisplayScale(){
  useEffect(()=>{
    try {
      const scale=localStorage.getItem("book-vacation-display-scale")||"85";
      document.documentElement.style.zoom=String(Number(scale)/100);
    } catch {
      document.documentElement.style.zoom="0.85";
    }
  },[]);
  return null;
}
