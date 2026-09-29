export function extractErrorMessage(error, defaultMsg = "An error occurred") {
  if (!error) return defaultMsg;
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.join(", ");
  }
  return defaultMsg;
}
