/**
 * Testing system for Healthy Plants
 */

describe("Healthy Plant Test", () => {

  test("Should identify a healthy leaf correctly", () => {
    const healthyLeaf = {
      isPlant: true,
      hasSymptoms: false
    };

    const identifyHealth = (image) => {
      if (image.isPlant && !image.hasSymptoms) {
        return "Healthy";
      }
      return "Diseased";
    };

    const result = identifyHealth(healthyLeaf);
    expect(result).toBe("Healthy");
  });

});
