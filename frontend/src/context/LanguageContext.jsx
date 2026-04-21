/**
 * Language Context
 * Provides i18n support for English and Nepali across the app.
 */
import { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en";
import ne from "../locales/ne";

const locales = { en, ne };

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(
        () => localStorage.getItem("language") || "en"
    );

    // Sync HTML lang attribute for accessibility and SEO
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = (lang) => {
        localStorage.setItem("language", lang);
        setLanguageState(lang);
    };

    
    const t = (key, options = {}) => {
        const parts = key.split(".");
        let value = locales[language];
        for (const part of parts) {
            value = value?.[part];
        }

        if (typeof value !== "string") return value ?? key;

        // Simple interpolation: replace {{key}} with options[key]
        return value.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
            const varName = p1.trim();
            return options[varName] !== undefined ? options[varName] : match;
        });
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
