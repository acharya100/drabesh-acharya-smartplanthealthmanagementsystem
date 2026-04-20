/**
 * Testing system for Disease Collection
 */
describe("Disease Collection Test", () => {

  test("Should display comprehensive guide to common plant diseases", () => {
    const diseaseDatabase = {
      searchQuery: "Apple Black Rot",
      resultsFound: true,
      diseaseDetails: ["Botryosphaeria obtusa", "SEVERE", "Brown and black rotting spots", "Contagious Disease"]
    };

    const validateDatabase = (database) => {
      const hasKeyDetails = database.diseaseDetails.every(detail => 
        database.diseaseDetails.includes(detail)
      );

      if (database.resultsFound && hasKeyDetails) {
        return "Comprehensive Guide Provided";
      }
      return "Insufficient Guide";
    };

    const result = validateDatabase(diseaseDatabase);
    expect(result).toBe("Comprehensive Guide Provided");
  });
});
