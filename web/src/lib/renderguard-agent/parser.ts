import type { AdkEvent } from "./types";

export function parseSseData(
  block: string,
): AdkEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("");

  if (!data || data === "[DONE]") {
    return null;
  }

  try {
    return JSON.parse(data) as AdkEvent;
  } catch {
    return null;
  }
}