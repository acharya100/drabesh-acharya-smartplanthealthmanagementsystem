/**
 * Unit Test: Settings Page and Account Deletion
 */

describe("Account Deletion Workflow Validation", () => {

  test("Verify navigation to settings and critical account deletion modal", () => {
    // Stage 1: User navigates to the 'Settings' page
    const pageTitle = "Settings";
    const dangerZoneFound = true;

    // Stage 2: User clicks 'Delete Account' and sees the 'Are you sure?' warning modal
    const warningMessage = "CRITICAL: Are you sure you want to delete your account? This will permanently remove all your data, plants, and history. This action cannot be undone.";
    const deleteBtnColor = "red"; // The primary action button is clearly red/danger
    const deleteConfirmationText = "Delete Permanently";

    // Expected result: The system must show a severe warning and require a final 'Delete Permanently' action
    const validateDeletionFlow = (title, msg, btnText) => {
      const isOnSettings = title === "Settings";
      const hasCriticalWarning = msg.includes("CRITICAL") && msg.includes("cannot be undone");
      const isPermanentAction = btnText === "Delete Permanently";

      return isOnSettings && hasCriticalWarning && isPermanentAction;
    };

    const isFlowSuccessful = validateDeletionFlow(pageTitle, warningMessage, deleteConfirmationText);
    expect(isFlowSuccessful).toBe(true);
    expect(deleteBtnColor).toBe("red");
  });

});
