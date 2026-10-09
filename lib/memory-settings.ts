import "server-only";

/** site_settings stand-in for running without Supabase (resets on restart). */
const g = globalThis as unknown as { __highluxSettings?: Map<string, unknown> };
const store = (): Map<string, unknown> => (g.__highluxSettings ??= new Map());

export function getMemorySetting<T>(key: string): Partial<T> | undefined {
  return store().get(key) as Partial<T> | undefined;
}
export function setMemorySetting(key: string, value: unknown) {
  store().set(key, value);
}
