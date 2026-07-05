export function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[]
): T | null | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}
