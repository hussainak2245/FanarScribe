export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://fanar-scribe-api.onrender.com";

export async function delay(ms = 180) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockRequest<T>(payload: T, ms = 180): Promise<T> {
  await delay(ms);
  return payload;
}
