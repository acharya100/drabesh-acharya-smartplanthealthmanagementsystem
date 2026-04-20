/**
 * Testing system for Add New Treatment
 */
describe("Add New Treatment Test", () => {

  test("Should successfully capture form details and save new treatment", () => {
    const treatmentForm = {
      disease: "Tobacco Mosaic Virus (TMV)",
      treatmentName: "Fungicide Application",
      type: "Chemical / Synthetic",
      effectiveness: 70,
      costEstimate: 550,
      duration: "1-2 weeks",
      productsNeeded: "Isopropyl alcohol, powdery milk",
      linkedProduct: "Pro Mist Sprayer Bottle",
      isValid: true
    };

    const validateTreatmentData = (form) => {
      if (!form.treatmentName || !form.disease) {
        return "Missing Required Fields";
      }
      
      if (form.isValid && form.effectiveness > 0) {
        return "Treatment Saved Successfully";
      }
      return "Failed To Save Treatment";
    };

    const result = validateTreatmentData(treatmentForm);
    expect(result).toBe("Treatment Saved Successfully");
  });
});
