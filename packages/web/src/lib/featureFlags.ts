function parseBooleanEnvFlag(rawValue: unknown, defaultValue: boolean): boolean {
  if (typeof rawValue !== 'string') {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return defaultValue;
}

export const isParentFunnelConversionTuneupEnabled = parseBooleanEnvFlag(
  import.meta.env.VITE_PARENT_FUNNEL_CONVERSION_TUNEUP_ENABLED,
  false,
);
