export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "₹0.00";
  }
  const num = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function parseNumber(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}
