/**
 * Unit Test: Register user with valid data
 */

describe("User Registration Form Submissions", () => {

  test("Register user with valid data", () => {
    // Action: User enters the following valid values
    const username = "durga";
    const emailAddress = "dsub444@gmail.com";
    const password = "okay.100";
    const confirmPassword = "okay.100";

    // Expected result: Passwords match, email has '@', length >= 8
    const validateForm = (user, email, pass, confirmPass) => {
      if (!email.includes('@')) return false;
      if (pass.length < 8) return false;
      if (pass !== confirmPass) return false;
      return true;
    };

    const isFormValid = validateForm(username, emailAddress, password, confirmPassword);

    // Actual result: Validation passes the valid dataset
    expect(isFormValid).toBe(true);
  });

});
