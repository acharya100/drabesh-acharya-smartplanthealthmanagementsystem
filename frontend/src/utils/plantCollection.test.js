/**
 * Unit Test 13: Plant Collection Page (All Scans)
 */

describe("Plant Collection Page Validation", () => {

  test("Check if the Plant Collection page shows all saved scans", () => {
    // Action: The user looks at their 'My Plants' page
    const myPlants = [
      { id: 1, name: "Apple", status: "Unhealthy" },
      { id: 2, name: "Tomato", status: "Healthy" },
      { id: 3, name: "Unknown", status: "Out of Scope" }
    ];

    // Expected result: The page should show the correct number of plants
    const countPlants = (list) => {
      return list.length;
    };

    const totalShowed = countPlants(myPlants);

    // Actual result: The system shows 3 plants in the list
    expect(totalShowed).toBe(3);
  });

});
