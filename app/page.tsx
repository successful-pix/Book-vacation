import Link from "next/link";
import { ArrowRight, Plane, BedDouble, CalendarDays, Globe2, ShieldCheck, Compass, Sparkles, MapPin } from "lucide-react";
import { TravelShell, FlightSearch } from "./components/TravelShell";

const destinations = [
  { name: "Brazil", flag: "🇧🇷", detail: "Rio beaches, lively cities and tropical coastlines", image: "photo-1483729558449-99ef09a8c325", label: "SOUTH AMERICA" },
  { name: "United Kingdom", flag: "🇬🇧", detail: "Historic streets, green countryside and London icons", image: "photo-1513635269975-59663e0ac1ad", label: "CITY & CULTURE" },
  { name: "Vietnam", flag: "🇻🇳", detail: "Limestone bays, lantern-lit towns and rich food culture", image: "photo-1528127269322-539801943592", label: "ASIA ESCAPE" },
  { name: "United States", flag: "🇺🇸", detail: "Big-city skylines, national parks and open roads", image: "photo-1496442226666-8d4d0e62e6e9", label: "BIG ADVENTURE" },
  { name: "Mexico", flag: "🇲🇽", detail: "Colourful streets, ancient sites and warm beaches", image: "photo-1512813195386-6cf811ad3542", label: "COLOUR & CULTURE" },
  { name: "Nigeria", flag: "🇳🇬", detail: "Vibrant cities, local flavour and beautiful landscapes", image: "photo-1516026672322-bc52d61a55d5", label: "WEST AFRICA" },
  { name: "Canada", flag: "🇨🇦", detail: "Lake views, mountain escapes and welcoming cities", image: "photo-1517935706615-2717063c2225", label: "GREAT OUTDOORS" },
  { name: "Australia", flag: "🇦🇺", detail: "Harbour views, surf beaches and wide-open nature", image: "photo-1506973035872-a4ec16b8e8d9", label: "OCEANIA" },
  { name: "Japan", flag: "🇯🇵", detail: "Temple gardens, neon skylines and mountain scenery", image: "photo-1493976040374-85c8e12f0c0e", label: "CULTURE & NATURE" },
  { name: "India", flag: "🇮🇳", detail: "Iconic monuments, colourful markets and diverse regions", image: "photo-1524492412937-b28074a5d7da", label: "TIMELESS JOURNEYS" },
  { name: "South Africa", flag: "🇿🇦", detail: "Mountain coastlines, wildlife and memorable road trips", image: "photo-1580060839134-75a5edca2e99", label: "WILD & BEAUTIFUL" },
  { name: "France", flag: "🇫🇷", detail: "Parisian cafés, art, countryside and coastal villages", image: "photo-1502602898657-3e91760cbb34", label: "EUROPE CLASSIC" },
  { name: "Indonesia", flag: "🇮🇩", detail: "Tropical beaches, temples and green rice terraces", image: "photo-1537996194471-e657df975ab4", label: "TROPICAL FAVOURITE" },
  { name: "United Arab Emirates", flag: "🇦🇪", detail: "Modern skylines, desert adventures and waterfront views", image: "photo-1512453979798-5ea266f8880c", label: "CITY LIGHTS" },
  { name: "Singapore", flag: "🇸🇬", detail: "Gardens, waterfront architecture and street-food favourites", image: "photo-1525625293386-3f8f99389edd", label: "CITY BREAK" },
  { name: "Greece", flag: "🇬🇷", detail: "Whitewashed villages and blue Aegean views", image: "photo-1613395877344-13d4a8e0d49e", label: "ISLAND ESCAPE" },
  { name: "New Zealand", flag: "🇳🇿", detail: "Alpine lakes, green valleys and dramatic coastlines", image: "photo-1469521669194-babb45599def", label: "NATURE ESCAPE" },
  { name: "China", flag: "🇨🇳", detail: "Historic landmarks, mountain scenery and modern cities", image: "photo-1508804185872-d7badad00f7d", label: "HISTORY & SCALE" },
  { name: "Thailand", flag: "🇹🇭", detail: "Golden temples, tropical islands and bustling markets", image: "photo-1508009603885-50cf7c579365", label: "TROPICAL ASIA" },
  { name: "South Korea", flag: "🇰🇷", detail: "Modern Seoul, traditional palaces and mountain trails", image: "photo-1538485399081-7c8d98a6fce3", label: "CITY & CULTURE" },
  { name: "Kenya", flag: "🇰🇪", detail: "Wildlife reserves, wide savannahs and coastal escapes", image: "photo-1516026672322-bc52d61a55d5", label: "WILDLIFE JOURNEYS" },
  { name: "Ghana", flag: "🇬🇭", detail: "Coastal forts, lively cities and welcoming culture", image: "photo-1516026672322-bc52d61a55d5", label: "WEST AFRICA" },
  { name: "Türkiye", flag: "🇹🇷", detail: "Cappadocia landscapes, historic bazaars and coastal towns", image: "photo-1570939274717-7eda259b50ed", label: "CROSSROADS OF CULTURE" },
  { name: "Philippines", flag: "🇵🇭", detail: "Turquoise lagoons, island beaches and reef adventures", image: "photo-1518509562904-e7ef99cdcc86", label: "ISLAND HOPPING" },
  { name: "Malaysia", flag: "🇲🇾", detail: "Rainforest trails, modern skylines and island beaches", image: "photo-1596422846543-75c6fc197f07", label: "CITY & NATURE" },
  { name: "Pakistan", flag: "🇵🇰", detail: "Mountain valleys, historic architecture and local markets", image: "photo-1587474260584-136574528ed5", label: "MOUNTAIN ADVENTURE" },
  { name: "Egypt", flag: "🇪🇬", detail: "Ancient monuments, Nile views and desert landscapes", image: "photo-1539650116574-75c0c6d73f6e", label: "ANCIENT WONDERS" },
  { name: "Saudi Arabia", flag: "🇸🇦", detail: "Desert horizons, heritage sites and modern city escapes", image: "photo-1586724237569-f3d0c1dee8c6", label: "DESERT DISCOVERY" },
  { name: "Switzerland", flag: "🇨🇭", detail: "Alpine villages, clear lakes and scenic train journeys", image: "photo-1531366936337-7c912a4589a7", label: "ALPINE ESCAPE" },
  { name: "Norway", flag: "🇳🇴", detail: "Fjords, mountain peaks and peaceful waterfront towns", image: "photo-1519681393784-d120267933ba", label: "NORDIC NATURE" },
  { name: "Sweden", flag: "🇸🇪", detail: "Waterfront cities, forests and Scandinavian design", image: "photo-1509356843151-3e7d96241e11", label: "NORDIC STYLE" },
  { name: "Denmark", flag: "🇩🇰", detail: "Harbour streets, cycle-friendly cities and cosy cafés", image: "photo-1513622470522-26c3c8a854bc", label: "SLOW CITY BREAK" },
  { name: "Germany", flag: "🇩🇪", detail: "Historic squares, castles and lively modern cities", image: "photo-1467269204594-9661b134dd2b", label: "EUROPE DISCOVERY" },
  { name: "Italy", flag: "🇮🇹", detail: "Coastal villages, historic landmarks and celebrated cuisine", image: "photo-1516483638261-f4dbaf036963", label: "ART & FLAVOUR" },
  { name: "Spain", flag: "🇪🇸", detail: "Sunny plazas, architecture and Mediterranean beaches", image: "photo-1539037116277-4db20889f2d4", label: "SUNNY ESCAPE" },
  { name: "Portugal", flag: "🇵🇹", detail: "Atlantic coastlines, tiled streets and hillside towns", image: "photo-1555881400-74d7acaacd8b", label: "COASTAL EUROPE" },
  { name: "Netherlands", flag: "🇳🇱", detail: "Canal-side streets, cycling routes and colourful markets", image: "photo-1512470876302-972faa2aa9a4", label: "CANAL CITY BREAK" },
  { name: "Ireland", flag: "🇮🇪", detail: "Green countryside, rugged coasts and lively music towns", image: "photo-1590089415225-401ed6f9db8e", label: "GREEN ESCAPE" },
  { name: "Poland", flag: "🇵🇱", detail: "Old-town squares, castles and welcoming city streets", image: "photo-1519197924294-4ba991a11128", label: "HISTORY & CITIES" },
  { name: "Argentina", flag: "🇦🇷", detail: "Mountain landscapes, vibrant Buenos Aires and wide-open spaces", image: "photo-1589909202802-8f4aadce1849", label: "SOUTHERN ADVENTURE" },
  { name: "Chile", flag: "🇨🇱", detail: "Andean peaks, desert scenery and Pacific coastlines", image: "photo-1519451241324-20b4ea2c4220", label: "LANDSCAPE JOURNEYS" },
  { name: "Colombia", flag: "🇨🇴", detail: "Colourful old towns, mountain views and Caribbean beaches", image: "photo-1536098561742-ca998e48cbcc", label: "COLOURFUL COLOMBIA" },
  { name: "Costa Rica", flag: "🇨🇷", detail: "Rainforests, Pacific beaches and volcanic landscapes", image: "photo-1518509562904-e7ef99cdcc86", label: "CENTRAL AMERICA" },
  { name: "Peru", flag: "🇵🇪", detail: "Andean scenery, ancient sites and dramatic mountain trails", image: "photo-1526392060635-9d6019884377", label: "ANCIENT PATHS" },
  { name: "Hong Kong", flag: "🇭🇰", detail: "Harbour skylines, hillside views and night markets", image: "photo-1506976785307-8732e854ad03", label: "HARBOUR CITY" },
  { name: "Taiwan", flag: "🇹🇼", detail: "Mountain scenery, night markets and coastal rail journeys", image: "photo-1506869640319-fe1a24fd76dc", label: "ISLAND DISCOVERY" },
  { name: "Bangladesh", flag: "🇧🇩", detail: "River landscapes, lively bazaars and green countryside", image: "photo-1589308078059-be1415eab4c3", label: "RIVER JOURNEYS" },
  { name: "Sri Lanka", flag: "🇱🇰", detail: "Tea hills, wildlife parks and warm Indian Ocean beaches", image: "photo-1588598198321-9735fd5242f8", label: "ISLAND NATURE" },
  { name: "Nepal", flag: "🇳🇵", detail: "Himalayan trails, mountain villages and spiritual landmarks", image: "photo-1544735716-392fe2489ffa", label: "HIMALAYAN ESCAPE" },
  { name: "Morocco", flag: "🇲🇦", detail: "Desert dunes, colourful souks and historic medinas", image: "photo-1539020140153-e479b8c22e70", label: "DESERT & MEDINA" },
  { name: "Qatar", flag: "🇶🇦", detail: "Waterfront skylines, museums and desert experiences", image: "photo-1578895101408-1a36b834405b", label: "MODERN ARABIA" },
  { name: "Kuwait", flag: "🇰🇼", detail: "Gulf waterfronts, contemporary architecture and cafés", image: "photo-1590490360182-c33d57733427", label: "GULF CITY BREAK" },
];

export default function HomePage() {
  return <TravelShell><main className="bv-home">
    <section className="bv-hero"><div className="bv-hero-image" aria-hidden="true"/><div className="container bv-hero-inner">
      <div className="bv-hero-copy"><div className="bv-eyebrow"><Sparkles size={15}/> YOUR NEXT CHAPTER STARTS HERE</div><h1>The world is waiting.<br/><span>Where will you go?</span></h1><p>Find flights, discover stays, and bring your next holiday together in one simple place.</p><div className="bv-hero-points"><span><Globe2 size={16}/> Worldwide destinations</span><span><ShieldCheck size={16}/> Clear booking requests</span></div><div className="bv-hero-quick-actions"><Link href="/tickets" className="bv-hero-track-link"><Plane size={18}/><span><strong>Track your ticket</strong><small>Check booking progress and payment updates</small></span><ArrowRight size={18}/></Link><Link href="/history" className="bv-hero-history-link">View request history <ArrowRight size={15}/></Link></div></div>
      <div className="bv-search-card"><div className="bv-search-tabs"><span className="active"><Plane size={17}/> Flights</span><Link href="/stays"><BedDouble size={17}/> Stays</Link><Link href="/flight-hotel"><CalendarDays size={17}/> Flight + hotel</Link></div><FlightSearch/></div>
    </div></section>
    <section className="container bv-shortcuts" aria-label="Explore Book Vacation"><Link href="/flights"><span className="bv-shortcut-icon"><Plane size={22}/></span><span><strong>Find flights</strong><small>Explore routes and travel dates</small></span><ArrowRight size={18}/></Link><Link href="/stays"><span className="bv-shortcut-icon"><BedDouble size={22}/></span><span><strong>Find a stay</strong><small>Hotels and holiday accommodation</small></span><ArrowRight size={18}/></Link><Link href="/flight-hotel"><span className="bv-shortcut-icon"><CalendarDays size={22}/></span><span><strong>Plan a full trip</strong><small>Coordinate flights and accommodation</small></span><ArrowRight size={18}/></Link></section>
    <section className="container bv-destinations"><div className="bv-section-heading"><div><div className="bv-eyebrow">EXPLORE THE WORLD</div><h2>Countries to explore</h2><p>Browse popular destinations, see a glimpse of each place and start planning your journey.</p></div><Link href="/tickets" className="bv-view-all">Browse ticket destinations <ArrowRight size={16}/></Link></div><div className="bv-destination-grid">{destinations.map(d=><article className="bv-destination-card" key={d.name}><div className="bv-destination-photo" style={{backgroundImage:"linear-gradient(180deg,rgba(7,27,56,.08) 15%,rgba(7,27,56,.78)),url(https://images.unsplash.com/"+d.image+"?auto=format&fit=crop&w=900&q=85)"}}><span>{d.label}</span><div><small><MapPin size={13}/> {d.flag} {d.name}</small><h3>{d.name}</h3></div></div><div className="bv-destination-body"><p>{d.detail}</p><Link href={"/flights?to="+encodeURIComponent(d.name)} aria-label={"Plan a trip to "+d.name}>Plan this trip <ArrowRight size={15}/></Link></div></article>)}</div></section>
    <section className="bv-why"><div className="container bv-why-grid"><div className="bv-why-visual"><div className="bv-why-photo"/><div className="bv-location-card"><span><MapPin size={16}/></span><div><strong>Your world, your way</strong><small>Start from wherever you are</small></div></div></div><div className="bv-why-copy"><div className="bv-eyebrow">MADE FOR TRAVELLERS</div><h2>Less time figuring it out.<br/><span>More time looking forward.</span></h2><p>Book Vacation brings the important parts of your holiday planning together, so you can focus on the places and people that matter.</p><div className="bv-benefit"><span><Globe2 size={20}/></span><div><strong>Made for worldwide travel</strong><p>Explore destinations and routes across countries and continents.</p></div></div><div className="bv-benefit"><span><Compass size={20}/></span><div><strong>Keep your plans together</strong><p>Return to your account to see your flight and accommodation requests.</p></div></div><div className="bv-benefit"><span><ShieldCheck size={20}/></span><div><strong>Clear and honest next steps</strong><p>We show requests as requests—not as confirmed tickets or invented live prices.</p></div></div><Link href="/signup" className="bv-primary-link">Create your free account <ArrowRight size={16}/></Link></div></div></section>
    <section className="container bv-final-cta"><div><div className="bv-eyebrow">YOUR NEXT HOLIDAY STARTS HERE</div><h2>Ready to see somewhere new?</h2><p>Start with a destination, a date, or just a little inspiration.</p></div><div><Link href="/flights" className="bv-cta-button"><Plane size={17}/> Explore flights</Link><Link href="/stays" className="bv-cta-secondary">Browse stays <ArrowRight size={15}/></Link></div></section>
  </main></TravelShell>;
}
