const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returns the streak value to display in UI.
 * Resets to 0 if more than 1 day has passed since last study.
 * lastStudyTimestamp may be a Firestore Timestamp (with .toDate()) or a Date/null.
 */
export function getDisplayStreak(
  currentStreak: number,
  lastStudyTimestamp: { toDate?: () => Date } | Date | null | undefined,
): number {
  if (!lastStudyTimestamp) return currentStreak;

  const rawDate =
    typeof (lastStudyTimestamp as any).toDate === 'function'
      ? (lastStudyTimestamp as any).toDate()
      : new Date(lastStudyTimestamp as Date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(rawDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - last.getTime()) / MS_PER_DAY);
  return diffDays > 1 ? 0 : currentStreak;
}

/**
 * Calculates the new streak value after a study session.
 * Used in Firestore write operations.
 */
export function calcUpdatedStreak(
  currentStreak: number,
  lastStudyTimestamp: { toDate?: () => Date } | null | undefined,
): number {
  if (!lastStudyTimestamp) return 1;

  const lastDate =
    typeof (lastStudyTimestamp as any).toDate === 'function'
      ? (lastStudyTimestamp as any).toDate()
      : new Date(lastStudyTimestamp as any);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - last.getTime()) / MS_PER_DAY);

  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak + 1;
  return 1;
}
