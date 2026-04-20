/**
 * Unit Test 4: Login user with valid credentials
 */

describe("User Login Authentication Validation", () => {

  test("Login user with valid credentials", () => {
    // Action: User enters the following correct values
    const loginEmail = "dsub444@gmail.com";
    const loginPassword = "okay.100";

    // Expected result: This will validate the credentials successfully
    const validateLoginCredentials = (email, password) => {
      const dbEmail = "dsub444@gmail.com";
      const dbPassword = "okay.100";
      return (email === dbEmail && password === dbPassword);
    };

    const isLoginSuccessful = validateLoginCredentials(loginEmail, loginPassword);

    // Actual result: Authentication accepts the matching credentials returning true
    expect(isLoginSuccessful).toBe(true);
  });
});
