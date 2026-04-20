/**
 * Testing system for Soil Analysis
 */

describe("Soil Analysis Test", () => {

  test("Should correctly identify nutrient levels", () => {
    const soilData = { nitrogen: 200, phosphorus: 60 };
    const optimal = {
      nitrogen: { low: 250, high: 300 },
      phosphorus: { low: 60, high: 120 }
    };

    const getStatus = (val, opt) => {
      if (val < opt.low) return "Low";
      if (val > opt.high) return "High";
      return "Good";
    };

    expect(getStatus(soilData.nitrogen, optimal.nitrogen)).toBe("Low");
    expect(getStatus(soilData.phosphorus, optimal.phosphorus)).toBe("Good");
  });

});
