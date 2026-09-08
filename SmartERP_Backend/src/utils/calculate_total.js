export function calculateTotal(price, quantity) {
  if (price < 0 || quantity < 0) {
    throw new Error("Price and quantity cannot be negative");
  }

  return price * quantity;
}