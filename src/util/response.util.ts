export function createResponse<T>(
  data?: T,
  message?: string,
  succeeded = true
) {
  return {
    succeeded,
    message: message || (succeeded ? "Request successful" : "Request failed"),
    data: data ?? null,
  };
}
