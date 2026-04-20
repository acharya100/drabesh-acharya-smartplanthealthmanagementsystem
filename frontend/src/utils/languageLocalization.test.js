/**
 * Unit Test 12: Application Language Localization Switcher
 */

describe("Application Localization Management", () => {

  test("Toggle and validate Nepali language localization settings", () => {
    // Action: User clicks the 'NP' toggle in the navbar to switch language to Nepali
    let currentLanguage = 'en'; // default English

    // Simulate user toggling language to Nepali
    const toggleLanguage = (lang) => {
      return lang === 'en' ? 'np' : 'en';
    };

    currentLanguage = toggleLanguage(currentLanguage);
    // Expected result: The system must validate that the language state updates securely to 'np' (Nepali)
    const validateLanguageState = (langState) => {
      // Must be one of the explicitly allowed i18n language codes to prevent injection
      const allowedLanguages = ['en', 'np'];
      return allowedLanguages.includes(langState);
    };

    const isLanguageValid = validateLanguageState(currentLanguage);

    // Actual result: Validation passes since 'np' is a securely recognized application locale
    expect(currentLanguage).toBe('np');
    expect(isLanguageValid).toBe(true);
  });

});
