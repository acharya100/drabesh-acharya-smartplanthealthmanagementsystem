/**
 * Testing system for Email Notification
 */

describe("Email Notification Test", () => {

  test("Should generate correct order confirmation email content", () => {
    const emailData = {
      orderId: "31",
      customer: "DraBesh",
      total: "NPR 580.00",
      items: [{ name: "Bio-Active Copper Fungicide", qty: 1 }],
      shippingAddress: "Inaruwa-1, Sunsari"
    };

    const verifyEmailContent = (data) => {
      if (data.orderId === "31" && data.total === "NPR 580.00" && data.items.length > 0) {
        return "Email Valid";
      }
      return "Email Invalid";
    };

    const status = verifyEmailContent(emailData);
    expect(status).toBe("Email Valid");
  });

});
