/**
 * Unit Test 14: Disease Detection Page (File Upload)
 */

describe("Disease Detection Page Validation", () => {

  test("Check if the system accepts the correct image file formats", () => {
    // Action: The user tries to upload different types of files
    const files = [
      { name: "leaf.png", size: 2, type: "image/png" },       // Correct
      { name: "plant.jpg", size: 3, type: "image/jpeg" },     // Correct
      { name: "report.pdf", size: 1, type: "application/pdf" } // Wrong
    ];

    // Expected result: The system should only allow image files like PNG and JPG
    const checkFile = (file) => {
      const allowedTypes = ["image/png", "image/jpeg"];
      return allowedTypes.includes(file.type);
    };

    const validFiles = files.filter(checkFile);

    // Actual result: The system finds 2 valid image files and rejects the PDF
    expect(validFiles.length).toBe(2);
    expect(validFiles[0].name).toBe("leaf.png");
    expect(validFiles[1].name).toBe("plant.jpg");
  });

});
