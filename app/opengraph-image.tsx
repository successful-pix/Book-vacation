import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Book Vacation — flights, stays and holidays around the world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", color: "white", background: "linear-gradient(125deg, #06284e 0%, #0756c8 62%, #1485db 100%)", fontFamily: "Arial, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -80, top: -140, width: 600, height: 600, borderRadius: 300, border: "2px solid rgba(255,255,255,.18)", display: "flex" }} />
      <div style={{ position: "absolute", right: 55, top: 40, width: 390, height: 390, borderRadius: 195, border: "1px solid rgba(255,255,255,.2)", display: "flex" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
        <div style={{ width: 58, height: 58, borderRadius: 17, background: "white", color: "#0756c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>B</div>
        <span>Book Vacation</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 850 }}>
        <div style={{ display: "flex", color: "#cce5ff", fontSize: 19, fontWeight: 700, letterSpacing: 5, marginBottom: 22 }}>YOUR WORLD. YOUR HOLIDAY.</div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2.5, display: "flex", flexDirection: "column" }}>
          <span>The world is waiting.</span>
          <span style={{ color: "#cce5ff" }}>Where will you go?</span>
        </div>
        <div style={{ fontSize: 25, color: "#e4efff", marginTop: 24, lineHeight: 1.4 }}>Discover flights, stays and your next holiday in one place.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 18, color: "#e5f1ff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.35)", borderRadius: 999, padding: "12px 20px" }}>✈  Flights</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.35)", borderRadius: 999, padding: "12px 20px" }}>⌂  Stays</div>
        <span style={{ marginLeft: "auto", color: "#cce5ff", fontSize: 16 }}>book-vacation.vercel.app</span>
      </div>
    </div>,
    { ...size }
  );
}
