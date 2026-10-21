"use client";

import { useEffect, useState } from "react";

type Language = "en" | "pt" | "es" | "fr" | "de" | "ar" | "vi";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "🇬🇧 English" },
  { code: "pt", label: "🇵🇹 Português" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "ar", label: "🇸🇦 العربية" },
  { code: "vi", label: "🇻🇳 Tiếng Việt" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean; layout?: number },
          elementId: string
        ) => unknown;
      };
    };
  }
}

function readLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const value = localStorage.getItem("book-vacation-language");
    return LANGUAGES.some((item) => item.code === value) ? (value as Language) : "en";
  } catch {
    return "en";
  }
}

function setTranslationCookie(language: Language) {
  const value = language === "en" ? "/en/en" : "/en/" + language;
  const expires = language === "en" ? "Thu, 01 Jan 1970 00:00:00 GMT" : "Fri, 31 Dec 9999 23:59:59 GMT";
  const cookie = "googtrans=" + value + "; expires=" + expires + "; path=/; SameSite=Lax";
  document.cookie = cookie;
  if (location.hostname.endsWith("bookvacation.online")) {
    document.cookie = cookie + "; domain=.bookvacation.online";
  }
}

export default function SiteTranslation() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");

  useEffect(() => {
    setSelectedLanguage(readLanguage());

    // Google Translate translates full page content, including longer copy and dynamically
    // rendered sections that a small hand-written dictionary cannot cover.
    const win = window;
    win.googleTranslateElementInit = () => {
      const TranslateElement = win.google?.translate?.TranslateElement;
      if (TranslateElement && document.getElementById("google_translate_element")) {
        new TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,pt,es,fr,de,ar,vi",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    if (!document.querySelector('script[data-book-vacation-google-translate="true"]')) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.bookVacationGoogleTranslate = "true";
      script.onerror = () => {
        console.error("Book Vacation translation service could not load.");
      };
      document.head.appendChild(script);
    } else if (win.google?.translate?.TranslateElement) {
      win.googleTranslateElementInit();
    }

    // If a language was selected previously, restore the full-page translation cookie.
    const saved = readLanguage();
    if (saved !== "en") setTranslationCookie(saved);

    return () => {
      delete win.googleTranslateElementInit;
    };
  }, []);

  function changeLanguage(language: Language) {
    setSelectedLanguage(language);
    try {
      localStorage.setItem("book-vacation-language", language);
    } catch {
      // The language still applies for this page even if storage is unavailable.
    }
    setTranslationCookie(language);
    // Reload lets Google's page translator translate the whole page consistently.
    window.location.reload();
  }

  return (
    <>
      <div
        id="google_translate_element"
        aria-hidden="true"
        style={{ position: "fixed", left: "-10000px", top: 0, width: 1, height: 1, overflow: "hidden" }}
      />
      <div
        translate="no"
        className="notranslate"
        data-no-translate
        style={{
          position: "fixed",
          right: 12,
          bottom: "max(12px, env(safe-area-inset-bottom))",
          zIndex: 2147483647,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 11px",
          borderRadius: 14,
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          boxShadow: "0 6px 24px rgba(15,23,42,.22)",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 18 }}>🌐</span>
        <label htmlFor="book-vacation-language-select" style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
          Language
        </label>
        <select
          id="book-vacation-language-select"
          aria-label="Choose website language"
          value={selectedLanguage}
          onChange={(event) => changeLanguage(event.target.value as Language)}
          style={{
            width: 132,
            maxWidth: "38vw",
            padding: "8px 7px",
            border: "1px solid #94a3b8",
            borderRadius: 9,
            background: "#fff",
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>{language.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}
