/**
 * Testing system for Invalid File Formats
 */

describe("Invalid File Format Test", () => {

  test("Should reject a PDF file and show an error", () => {
    const uploadedFile = {
      name: "my_notes.pdf",
      extension: "pdf"
    };

    const validateFormat = (file) => {
      const allowedExtensions = ["jpg", "jpeg", "png"];
      if (!allowedExtensions.includes(file.extension)) {
        return "Invalid File Format";
      }
      return "Valid";
    };

    const result = validateFormat(uploadedFile);
    expect(result).toBe("Invalid File Format");
  });

});
