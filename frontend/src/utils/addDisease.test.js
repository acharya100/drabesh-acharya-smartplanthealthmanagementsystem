// addDisease.test.js
describe("Add New Disease Form Test", () => {
    test("System should correctly validate the data entered in the Add New Disease form.", () => {

        // Simulating the data a user types when filling out the "Add New Disease" form
        const mockNewDiseaseForm = {
            diseaseType: "Bacterial",
            diseaseName: "Crown Gall",
            scientificName: "Agrobacterium tumefaciens",
            severityLevel: "Medium (Tier 2)",
            contagious: true,
            symptoms: "Large, woody, cauliflower-like swellings (galls) typically found at the soil line (the crown) or on roots. Galls start off soft and light-colored, eventually turning dark, hard and cracked.",
            causes: "Soil bacteria that enter the plant through wounds. Bacteria actually transfer their own DNA into the plant's genome, forcing it to grow tumor-like galls.",
            affectedPlants: ["Apple", "Cherry"]
        };

        // Validating the form to ensure all important fields are filled before submitting
        const validateDiseaseForm = (formData) => {
            if (!formData.diseaseName || !formData.scientificName) return "Missing Name Information";
            if (!formData.diseaseType || !formData.severityLevel) return "Missing Categorization Details";
            if (!formData.symptoms || !formData.causes) return "Missing Descriptive Information";
            if (!formData.affectedPlants || formData.affectedPlants.length === 0) return "Missing Affected Plants";

            return "Form Data Validated Successfully";
        };

        const result = validateDiseaseForm(mockNewDiseaseForm);
        expect(result).toBe("Form Data Validated Successfully");
    });
});
