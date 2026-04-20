/**
 * Testing system for Expert Chat
 */
describe("Expert Chat Test", () => {

  test("Should provide relevant advice for plant diseases", () => {
    const chatSession = {
      question: "how to treat apple black rot",
      responseReceived: true,
      keywordsFound: ["prune", "spray", "fungal", "Apple Black Rot"]
    };

    const validateResponse = (session) => {
      const hasKeyInfo = session.keywordsFound.every(kw => 
        session.keywordsFound.includes(kw)
      );

      if (session.responseReceived && hasKeyInfo) {
        return "Insightful Advice Provided";
      }
      return "Insufficient Advice";
    };

    const result = validateResponse(chatSession);
    expect(result).toBe("Insightful Advice Provided");
  });
});
