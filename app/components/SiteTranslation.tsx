"use client";

import { useEffect } from "react";

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
  useEffect(() => {
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


  return (
    <div
      id="google_translate_element"
      aria-hidden="true"
      translate="no"
      style={{ position: "absolute", left: "-10000px", top: 0, width: 1, height: 1, overflow: "hidden" }}
    />
  );
}
