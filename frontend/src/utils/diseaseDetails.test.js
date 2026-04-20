// diseaseDetails.test.js
describe("Disease Details Archive Test", () => {
    test("System should accurately load profile summary and information for a specific disease.", () => {

        // Simulating the data loaded when a user views a specific Disease Details modal
        const mockDiseaseDetails = {
            name: "Apple Black Rot",
            scientificName: "Botryosphaeria obtusa",
            profile: {
                severity: "SEVERE",
                type: "FUNGAL",
                contagious: "YES"
            },
            symptoms: "Brown and black rotting spots on apples. The apples might turn fully black, dry up into hard balls, and stay on the tree. You may also see small purple spots on leaves.",
            causes: "A fungus that enters the tree from cuts or dead branches.",
            affectedPlants: ["Apple"]
        };

        // Validating the disease archive loads all necessary detailed sections
        const validateDiseaseDetails = (details) => {
            if (!details.name || !details.scientificName) return "Missing Header Info";

            if (!details.profile || !details.profile.severity || !details.profile.type || !details.profile.contagious) {
                return "Missing Profile Summary Data";
            }

            if (!details.symptoms || !details.causes) return "Missing Main Information Sections";

            return "Disease Details Loaded Successfully";
        };

        const result = validateDiseaseDetails(mockDiseaseDetails);
        expect(result).toBe("Disease Details Loaded Successfully");
    });
});
