/**
 * Testing system for Valid Disease Detection
 */

describe("Valid Disease Detection Test", () => {

  test("Should identify 'Cedar Apple Rust' in an Apple leaf image", () => {
    const diseasedLeaf = {
      plant: "Apple",
      symptoms: ["orange spots", "rust"],
      expectedDisease: "Cedar Apple Rust"
    };

    const detectDisease = (image) => {
      if (image.plant === "Apple" && image.symptoms.includes("rust")) {
        return "Cedar Apple Rust";
      }
      return "Healthy";
    };

    const result = detectDisease(diseasedLeaf);
    expect(result).toBe("Cedar Apple Rust");
  });

});
