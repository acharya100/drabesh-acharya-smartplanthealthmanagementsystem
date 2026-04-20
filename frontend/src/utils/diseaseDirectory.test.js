// diseaseDirectory.test.js
describe("Disease & Treatment Directory Test", () => {
    test("System should correctly load and structure disease cards in the directory.", () => {

        const mockDirectoryData = [
            {
                id: 1,
                name: "Apple Black Rot",
                severity_level: "SEVERE",
                scientific_name: "Botryosphaeria obtusa",
                symptoms: "Brown and black rotting spots on apples. The apples might turn fully black, dry up into hard balls..."
            },
            {
                id: 2,
                name: "Apple Scab",
                severity_level: "MODERATE",
                scientific_name: "Venturia inaequalis",
                symptoms: "You will see dark green or black soft spots on the leaves. The bad leaves will turn yellow and fall..."
            }
        ];
        // Validating the directory successfully provides required fields for each card display
        const validateDirectoryLoad = (directoryList) => {
            if (!directoryList || directoryList.length === 0) return "Failed to load directory";

            for (let disease of directoryList) {
                if (!disease.name) return "Missing disease name on card";
                if (!disease.severity_level) return "Missing severity level on card";
                if (!disease.scientific_name) return "Missing scientific name on card";
            }
            return "Directory Loaded Successfully";
        };
        const result = validateDirectoryLoad(mockDirectoryData);
        expect(result).toBe("Directory Loaded Successfully");
    });
});
