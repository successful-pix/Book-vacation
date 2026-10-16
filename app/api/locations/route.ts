import { NextResponse } from "next/server";
export const revalidate = 0;
type Place={label:string;name:string;country:string;countryCode:string;kind:"city"|"airport";latitude?:number;longitude?:number};
export async function GET(request:Request){
 const q=new URL(request.url).searchParams.get("q")?.trim()||"";
 if(q.length<2)return NextResponse.json({results:[]});
 try{
  const geoUrl=new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name",q);geoUrl.searchParams.set("count","12");geoUrl.searchParams.set("language","en");geoUrl.searchParams.set("format","json");
  const geoRes=await fetch(geoUrl,{next:{revalidate:3600}});
  const geoData=geoRes.ok?await geoRes.json():{results:[]};
  const cities:Place[]=(geoData.results||[]).filter((p:any)=>p.country_code!=="NG").map((p:any)=>({label:[p.name,p.admin1,p.country].filter(Boolean).filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).join(", "),name:p.name,country:p.country||"",countryCode:p.country_code||"",kind:"city",latitude:p.latitude,longitude:p.longitude}));
  let airports:Place[]=[];
  try{
   const osmUrl=new URL("https://nominatim.openstreetmap.org/search");
   osmUrl.searchParams.set("q",q+" airport");osmUrl.searchParams.set("format","jsonv2");osmUrl.searchParams.set("limit","6");osmUrl.searchParams.set("addressdetails","1");
   const osm=await fetch(osmUrl,{headers:{"User-Agent":"BookVacation/1.0 (travel location search)"},next:{revalidate:3600}});
   if(osm.ok){const data=await osm.json();airports=data.filter((p:any)=>p.address?.country_code?.toUpperCase()!=="NG").map((p:any)=>{const a=p.address||{};const city=a.city||a.town||a.municipality||a.county||a.state||"";const country=a.country||"";const name=p.name||p.display_name?.split(",")[0]||"Airport";return {label:[name,city,country].filter(Boolean).filter((v:string,i:number,arr:string[])=>arr.indexOf(v)===i).join(", "),name,country,countryCode:(a.country_code||"").toUpperCase(),kind:"airport",latitude:Number(p.lat),longitude:Number(p.lon)}})}
  }catch{}
  const unique=new Map<string,Place>();
  for(const p of [...airports,...cities]){const key=p.label.toLowerCase();if(!unique.has(key))unique.set(key,p)}
  return NextResponse.json({results:[...unique.values()].slice(0,12)});
 }catch{return NextResponse.json({results:[],error:"Location search is temporarily unavailable."},{status:502})}
}