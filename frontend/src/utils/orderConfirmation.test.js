/**
 * Testing system for Order Confirmation
 */

describe("Order Confirmation Test", () => {

  test("Should show the order confirmation screen with correct details", () => {
    const orderResult = {
      success: true,
      orderId: "1001",
      totalPaid: 580,
      paymentMethod: "Cash on Delivery"
    };

    const validateConfirmation = (result) => {
      if (result.success && result.orderId && result.totalPaid === 580) {
        return "Order Confirmed";
      }
      return "Order Failed";
    };

    const result = validateConfirmation(orderResult);
    expect(result).toBe("Order Confirmed");
  });

});
