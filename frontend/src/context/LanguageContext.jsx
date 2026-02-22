/**
 * Language Context
 * Provides i18n support for English and Nepali across the app.
 */
import { createContext, useContext, useState } from "react";
import en from "../locales/en";
import ne from "../locales/ne";

const locales = { en, ne };

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(
        () => localStorage.getItem("language") || "en"
    );

    const setLanguage = (lang) => {
        localStorage.setItem("language", lang);
        setLanguageState(lang);
    };

    /**
     * Translate a dot-notation key, e.g. t("nav.dashboard")
     */
    const t = (key) => {
        const parts = key.split(".");
        let value = locales[language];
        for (const part of parts) {
            value = value?.[part];
        }
        return value ?? key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
};

export default LanguageContext;
