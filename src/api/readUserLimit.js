export function readUserLimit(planSubs) {
  if (!Array.isArray(planSubs)) return null;

  const primary = planSubs
    .filter((row) => String(row?.status).toUpperCase() === 'ACTIVE')
    .filter(
      (row) =>
        String(row?.plan?.type).toUpperCase() === 'SUBSCRIPTION' &&
        String(row?.plan?.category).toUpperCase() === 'PRIMARY',
    );

  if (primary.length === 0) return null;

  const features = primary[0]?.plan?.features ?? [];
  const row = features.find((f) => String(f?.code).toUpperCase() === 'USER_LIMIT');
  const value = row?.value;

  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
