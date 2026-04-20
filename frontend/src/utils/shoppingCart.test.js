/**
 * Testing system for Shopping Cart and Order Summary
 */

describe("Shopping Cart Test", () => {

  test("Should calculate the total price correctly with free shipping", () => {
    const cart = {
      items: [{ name: "Bio-Active Copper Fungicide", price: 580, quantity: 1 }],
      shipping: 0
    };

    const calculateTotal = (cartData) => {
      const subtotal = cartData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      return subtotal + cartData.shipping;
    };

    const total = calculateTotal(cart);
    expect(total).toBe(580);
  });

});
