"use client";

import { useEffect, useState } from "react";

export default function LoadingSplash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setLeaving(true), 2700);
    const removeTimer = window.setTimeout(() => setVisible(false), 3000);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`bv-loading-screen${leaving ? " bv-loading-screen--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Book Vacation"
    >
      <div className="bv-loading-content">
        <div className="bv-loader-ring" aria-hidden="true">
          <span className="bv-loader-plane">✈</span>
        </div>
        <div className="bv-loader-brand">Book <span>Vacation</span></div>
        <div className="bv-loader-caption">Your journey starts here</div>
        <div className="bv-loader-progress" aria-hidden="true"><span /></div>
        <div className="bv-loader-status">Preparing your experience<span className="bv-loader-dots">...</span></div>
      </div>
      <style jsx>{`
        .bv-loading-screen {
          position: fixed; inset: 0; z-index: 2147483000;
          display: grid; place-items: center; overflow: hidden;
          background: radial-gradient(ellipse at 50% 42%, #f4f8ff 0%, #ffffff 58%, #eef4ff 100%);
          opacity: 1; visibility: visible;
          transition: opacity 300ms ease, visibility 300ms ease;
        }
        .bv-loading-screen--leaving { opacity: 0; visibility: hidden; pointer-events: none; }
        .bv-loading-content {
          width: min(86vw, 340px); display: flex; flex-direction: column;
          align-items: center; text-align: center; animation: bv-rise 600ms ease both;
        }
        .bv-loader-ring {
          width: 94px; height: 94px; border-radius: 50%; position: relative;
          display: grid; place-items: center; margin-bottom: 23px;
          border: 3px solid #e4ebf7; border-top-color: #1264e8;
          border-right-color: #1264e8; animation: bv-spin 1s linear infinite;
          box-shadow: 0 8px 28px rgba(18,100,232,.09);
        }
        .bv-loader-ring::before {
          content: ""; position: absolute; inset: 8px; border-radius: 50%;
          border: 1px dashed #b9cff7; animation: bv-spin 5s linear infinite reverse;
        }
        .bv-loader-plane {
          color: #1264e8; font-size: 29px; line-height: 1;
          display: block; animation: bv-counter-spin 1s linear infinite;
        }
        .bv-loader-brand {
          color: #12233f; font-size: clamp(27px, 7vw, 34px); font-weight: 800;
          letter-spacing: -1.3px; line-height: 1.1;
          animation: bv-flash 1.35s ease-in-out infinite;
        }
        .bv-loader-brand span { color: #1264e8; }
        .bv-loader-caption { margin-top: 9px; font-size: 13px; color: #64748b; letter-spacing: .35px; }
        .bv-loader-progress {
          margin-top: 28px; width: 170px; height: 4px; border-radius: 999px;
          background: #e4ebf7; overflow: hidden;
        }
        .bv-loader-progress span {
          display: block; height: 100%; width: 40%; border-radius: inherit;
          background: linear-gradient(90deg, #1264e8, #56a5ff);
          animation: bv-progress 2.5s ease-in-out forwards;
        }
        .bv-loader-status { margin-top: 12px; color: #8290a5; font-size: 11px; letter-spacing: .25px; }
        .bv-loader-dots { display: inline-block; width: 15px; text-align: left; animation: bv-dots 1s steps(4, end) infinite; overflow: hidden; vertical-align: bottom; }
        @keyframes bv-spin { to { transform: rotate(360deg); } }
        @keyframes bv-counter-spin { to { transform: rotate(-360deg); } }
        @keyframes bv-flash { 0%, 100% { opacity: 1; } 50% { opacity: .56; } }
        @keyframes bv-progress { 0% { width: 0; } 75% { width: 82%; } 100% { width: 100%; } }
        @keyframes bv-dots { 0% { width: 0; } 25% { width: 4px; } 50% { width: 8px; } 75%, 100% { width: 12px; } }
        @keyframes bv-rise { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .bv-loader-ring, .bv-loader-ring::before, .bv-loader-plane, .bv-loader-brand,
          .bv-loader-progress span, .bv-loader-dots, .bv-loading-content { animation-duration: 3s; }
        }
      `}</style>
    </div>
  );
}
