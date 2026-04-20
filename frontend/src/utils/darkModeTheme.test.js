/**
 * Unit Test 11: Dark Mode Theme Switcher
 */

describe("Application Theme Management", () => {

  test("Toggle and validate Dark Mode theme settings", () => {
    // Action: User clicks the moon/sun icon in the navbar to toggle dark mode
    let currentTheme = 'light';

    // Simulate user toggling to dark mode
    const toggleTheme = (theme) => {
      return theme === 'light' ? 'dark' : 'light';
    };

    currentTheme = toggleTheme(currentTheme);

    // Expected result: The system must validate that the theme state securely updates to 'dark'
    const validateThemeState = (themeState) => {
      // Must be one of the explicitly allowed theme strings to prevent CSS injection
      const allowedThemes = ['light', 'dark', 'system'];
      return allowedThemes.includes(themeState);
    };

    const isThemeValid = validateThemeState(currentTheme);

    // Actual result: Validation passes since 'dark' is a securely recognized application state
    expect(currentTheme).toBe('dark');
    expect(isThemeValid).toBe(true);
  });

});
