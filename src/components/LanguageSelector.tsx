import { useTranslation } from "../i18n";
import type { Locale } from "../i18n";

const LOCALES: Locale[] = ["en", "es"];

export default function LanguageSelector() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="lang-selector">
      {LOCALES.map((lang) => (
        <button
          key={lang}
          className={`lang-selector__btn ${locale === lang ? "lang-selector__btn--active" : ""}`}
          onClick={() => setLocale(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
