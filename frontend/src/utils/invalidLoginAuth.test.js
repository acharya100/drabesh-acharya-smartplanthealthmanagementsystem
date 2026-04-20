/**
 * Unit Test 3: Login user with incorrect email address or password
 */

describe("User Login Authentication Validation", () => {

  test("Login user with incorrect email address or password", () => {
    // Action: User enters the following values
    const loginEmail = "dsub444@gmail.com";
    const loginPassword = "okay.200"; // Assuming the real password is okay.100

    // Expected result: This will show error message saying "Incorrect email or password. Please check your credentials."
    const validateLoginCredentials = (email, password) => {
      const dbEmail = "dsub444@gmail.com";
      const dbPassword = "okay.100";
      return (email === dbEmail && password === dbPassword);
    };

    const isLoginSuccessful = validateLoginCredentials(loginEmail, loginPassword);

    expect(isLoginSuccessful).toBe(false);
  });

});
