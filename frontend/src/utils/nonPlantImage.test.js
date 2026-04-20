/**
 * Testing system for Non-Plant Images
 */

describe("Non-Plant Image Test", () => {

  test("Should identify a non-plant image correctly", () => {
    const uploadedImage = {
      name: "dog_picture.jpg",
      containsPlant: false
    };

    const checkImage = (image) => {
      if (image.containsPlant === false) {
        return "Not a Plant";
      }
      return "Plant";
    };

    const result = checkImage(uploadedImage);
    expect(result).toBe("Not a Plant");
  });

});
