export function normalizeIndianPhone(
  value: string,
): string | null {
  const digits = value.replace(
    /\D/g,
    "",
  );

  let normalized = digits;

  if (
    normalized.length === 12 &&
    normalized.startsWith("91")
  ) {
    normalized =
      normalized.slice(2);
  }

  if (
    normalized.length === 11 &&
    normalized.startsWith("0")
  ) {
    normalized =
      normalized.slice(1);
  }

  if (
    !/^[6-9]\d{9}$/.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

export function maskIndianPhone(
  normalizedPhone: string,
) {
  if (
    !/^\d{10}$/.test(
      normalizedPhone,
    )
  ) {
    return "**********";
  }

  return `******${normalizedPhone.slice(
    -4,
  )}`;
}