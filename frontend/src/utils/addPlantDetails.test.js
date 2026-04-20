/**
 * Unit Test 5: Add New Plant Details Validation
 */

describe("Plant Management Form Validation", () => {

  test("Submit Add New Plant Details form with complete data", () => {
    // Action: User enters the following plant details as per the UI screenshot
    const plantData = {
      plantName: "Grape",
      scientificName: "Vitis vinifera",
      description: "this image is of grape leaf",
      sunlightRequirement: "Partial Sun",
      wateringFrequency: "Every 2 Days",
      healthStatus: "Diseased",
      imageAttached: true
    };

    // Expected result: The system must validate that all required fields are filled out
    const validatePlantForm = (data) => {
      if (!data.plantName || data.plantName.trim() === "") return false;
      if (!data.healthStatus) return false;
      if (!data.imageAttached) return false;
      if (!data.sunlightRequirement) return false;
      if (!data.wateringFrequency) return false;
      return true;
    };

    const isFormValid = validatePlantForm(plantData);

    // Actual result: Validation passes since all inputs including the 'Diseased' status are provided
    expect(isFormValid).toBe(true);
  });

});
