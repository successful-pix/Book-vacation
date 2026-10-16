"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const CURRENCIES = [
  ["USD","US dollar"],["NGN","Nigerian naira"],["GBP","British pound"],["EUR","Euro"],
  ["GHS","Ghanaian cedi"],["KES","Kenyan shilling"],["ZAR","South African rand"],
  ["INR","Indian rupee"],["CAD","Canadian dollar"],["AUD","Australian dollar"],["BRL","Brazilian real"]
] as const;
type CurrencyContextValue={currency:string;setCurrency:(currency:string)=>void;rates:Record<string,number>;ratesReady:boolean;toUSD:(amount:number,sourceCurrency?:string)=>number|null;formatUSD:(amount:number)=>string;formatLocal:(amount:number)=>string;localCurrency:string};
const CurrencyContext=createContext<CurrencyContextValue|null>(null);
const money=(amount:number,currency:string)=>new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:currency==="NGN"||currency==="GHS"||currency==="KES"?0:2}).format(amount);
function detectedCurrency(){if(typeof navigator==="undefined")return "USD";const locale=navigator.language||"en-US";const region=locale.split("-").pop()?.toUpperCase();const map:Record<string,string>={NG:"NGN",GB:"GBP",IE:"EUR",FR:"EUR",DE:"EUR",ES:"EUR",IT:"EUR",PT:"EUR",GH:"GHS",KE:"KES",ZA:"ZAR",IN:"INR",CA:"CAD",AU:"AUD",BR:"BRL"};return map[region||""]||"USD"}
export function CurrencyProvider({children}:{children:React.ReactNode}){
 const [currency,setCurrencyState]=useState("USD"),[rates,setRates]=useState<Record<string,number>>({USD:1}),[ratesReady,setRatesReady]=useState(false);
 useEffect(()=>{const saved=localStorage.getItem("book-vacation-currency");setCurrencyState(saved||detectedCurrency());fetch("https://open.er-api.com/v6/latest/USD").then(r=>{if(!r.ok)throw new Error("rates unavailable");return r.json()}).then(data=>{if(data?.result==="success"&&data.rates){setRates(data.rates);setRatesReady(true)}}).catch(()=>setRatesReady(false)},[]);
 const setCurrency=useCallback((next:string)=>{if(!CURRENCIES.some(c=>c[0]===next))return;setCurrencyState(next);localStorage.setItem("book-vacation-currency",next)},[]);
 const toUSD=useCallback((amount:number,sourceCurrency="USD")=>{if(!Number.isFinite(amount))return null;const sourceRate=rates[sourceCurrency];if(!sourceRate)return sourceCurrency==="USD"?amount:null;return amount/sourceRate},[rates]);
 const formatUSD=useCallback((amount:number)=>money(amount,"USD"),[]);
 const formatLocal=useCallback((amount:number)=>{const converted=ratesReady?amount*(rates[currency]||1):amount;return money(converted,ratesReady?currency:"USD")},[currency,rates,ratesReady]);
 const value=useMemo(()=>({currency,setCurrency,rates,ratesReady,toUSD,formatUSD,formatLocal,localCurrency:currency}),[currency,setCurrency,rates,ratesReady,toUSD,formatUSD,formatLocal]);
 return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}
export function useCurrency(){const value=useContext(CurrencyContext);if(!value)throw new Error("useCurrency must be used within CurrencyProvider");return value}
export function CurrencyPicker({compact=false}:{compact?:boolean}){const {currency,setCurrency}=useCurrency();return <label className={"currency-picker"+(compact?" compact":"")} aria-label="Display currency"><span>Currency</span><select value={currency} onChange={e=>setCurrency(e.target.value)} aria-label="Choose display currency">{CURRENCIES.map(([code,name])=><option value={code} key={code}>{code} · {name}</option>)}</select></label>}
