export function createResponse<T>(
  dataOrMessage?: T | null,
  message?: string,
  succeeded = true
) {
  if (typeof dataOrMessage === "string") {
    return {
      succeeded,
      message: dataOrMessage,
      data: null,
    };
  }

  return {
    succeeded,
    message: message || (succeeded ? "Request successful" : "Request failed"),
    data: dataOrMessage ?? null,
  };
}
