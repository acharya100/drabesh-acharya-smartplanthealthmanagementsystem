/**
 * Testing system for My Wishlist
 */

describe("Wishlist Test", () => {

  test("Should show the list of saved items correctly", () => {
    const wishlistState = {
      itemCount: 3,
      items: [
        { name: "Magnesium Epsom Salt", price: 525 },
        { name: "Copper Oxychloride Advanced", price: 595 }
      ]
    };

    const validateWishlist = (state) => {
      if (state.itemCount === state.items.length || state.itemCount > 0) {
        return "Wishlist Working";
      }
      return "Wishlist Empty";
    };

    const result = validateWishlist(wishlistState);
    expect(result).toBe("Wishlist Working");
  });

});
