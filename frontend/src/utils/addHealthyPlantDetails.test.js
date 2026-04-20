/**
 * Unit Test 7: Add Healthy Plant Details Validation
 */

describe("Plant Management Form Validation", () => {

  test("Submit Add New Plant Details form with healthy status data", () => {
    // Action: User enters the following plant details as per the UI screenshot
    const plantData = {
      plantName: "Corn",
      scientificName: "Zea mays",
      description: "healthy corn leaf image",
      sunlightRequirement: "Partial Sun",
      wateringFrequency: "Weekly",
      healthStatus: "Healthy",
      imageAttached: true
    };

    // Expected result: The system must validate that all required fields are filled out
    const validatePlantForm = (data) => {
      if (!data.plantName || data.plantName.trim() === "") return false;
      if (!data.healthStatus) return false;
      if (!data.imageAttached) return false;
      // Optionally checking if sunlight/watering selections are valid non-empty dropdowns
      if (!data.sunlightRequirement) return false;
      if (!data.wateringFrequency) return false;

      return true;
    };

    const isFormValid = validatePlantForm(plantData);

    // Actual result: Validation passes since all inputs including the 'Healthy' status are provided
    expect(isFormValid).toBe(true);
  });
});
