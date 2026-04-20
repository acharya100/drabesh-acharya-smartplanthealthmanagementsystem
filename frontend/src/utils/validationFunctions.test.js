/**
 * Unit Test 1: Register user with invalid email address
 */
import { validateEmail, validatePassword } from "./validationFunctions.js";

describe("User Registration Form Submissions", () => {

  test("Register user with invalid email address", () => {
    // User enters the following values
    const username = "ramesh";
    const emailAddress = "ramesh@com"; // Missing domain suffix
    const password = "rameshwa";

    // This will show error message showing email address is invalid
    const isEmailValid = validateEmail(emailAddress);

    expect(isEmailValid).toBe(false);
  });

});
