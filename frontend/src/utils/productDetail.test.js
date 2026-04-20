/**
 * Testing system for Product Detail and Add to Cart
 */

describe("Product Detail Test", () => {

  test("Should add a product to the cart and update the count", () => {
    let cartCount = 0;
    const product = {
      name: "Bio-Active Copper Fungicide",
      price: 580,
      stock: 99
    };

    const addToCart = (item) => {
      if (item.stock > 0) {
        cartCount += 1;
        return true;
      }
      return false;
    };

    const result = addToCart(product);
    expect(result).toBe(true);
    expect(cartCount).toBe(1);
  });

});
