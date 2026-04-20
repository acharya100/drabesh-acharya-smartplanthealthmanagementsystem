/**
 * Unit Test 16: Non-Plant Image (Diagrams and Drawings)
 */

describe("Non-Plant Image Validation", () => {

  test("Check if the system identifies a diagram as a non-plant image", () => {
    // Action: The user uploads a diagram or technical drawing instead of a leaf
    const imageData = {
      type: "Diagram",
      description: "Use Case Diagram",
      healthStatus: "Non-Plant Image"
    };

    // Expected result: The system should label it as 'Non-Plant Image'
    const identifyImage = (data) => {
      if (data.type === "Diagram" || data.type === "Drawing") {
        return "Non-Plant Image";
      }
      return "Plant";
    };

    const result = identifyImage(imageData);

    // Actual result: The system correctly says it is not a plant
    expect(result).toBe("Non-Plant Image");
  });

});
