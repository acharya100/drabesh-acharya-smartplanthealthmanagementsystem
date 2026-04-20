/**
 * Unit Test 2: Register user with password less than 8 characters
 */
import { validatePassword } from "./validationFunctions.js";

describe("User Registration Password Validation", () => {

  test("Register user with password less than 8 characters", () => {
    // Action: User enters the following values
    const username = "durga";
    const emailAddress = "dsub44@gmail.com";
    const password = "okay"; // Less than 8 characters

    //This will show error message saying password should be 8 characters long
    const isPasswordValid = validatePassword(password);

    //Validation rejects the short password
    expect(isPasswordValid).toBe(false);
  });

});
