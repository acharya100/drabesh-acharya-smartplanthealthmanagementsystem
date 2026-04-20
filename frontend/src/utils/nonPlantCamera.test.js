/**
 * Testing system for Non-Plant Images (Camera)
 */

describe("Non-Plant Camera Image Test", () => {

  test("Should identify a camera photo of a person as a non-plant", () => {
    const cameraPhoto = {
      source: "Camera",
      containsHumanFace: true,
      containsPlant: false
    };

    const identifyImage = (photo) => {
      if (photo.containsHumanFace || !photo.containsPlant) {
        return "Non-Plant Image";
      }
      return "Plant";
    };

    const result = identifyImage(cameraPhoto);
    expect(result).toBe("Non-Plant Image");
  });

});
