/**
 * Testing system for Out of Scope Images
 */

describe("Out of Scope Image Test", () => {

  test("Should identify a plant leaf not in the dataset as 'Out of Scope'", () => {
    const unknownPlant = {
      isPlant: true,
      isInSupportedDataset: false
    };

    const identifyImage = (image) => {
      if (image.isPlant && !image.isInSupportedDataset) {
        return "Out of Scope";
      }
      return "Valid Plant";
    };

    const result = identifyImage(unknownPlant);
    expect(result).toBe("Out of Scope");
  });

});
