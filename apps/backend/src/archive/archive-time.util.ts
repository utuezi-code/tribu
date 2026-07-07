import { DateTime } from "luxon";

const GRACE_PERIOD_HOURS = 48;

/**
 * Minuit local (fuseau de l'organisateur) du lendemain de la date de fin :
 * l'événement reste actif toute la journée de `endDate`, puis se verrouille
 * au passage à minuit.
 */
export function computeLockAt(endDate: Date, timezone: string): Date {
  const endInZone = DateTime.fromJSDate(endDate, { zone: timezone });
  const lockAt = endInZone.plus({ days: 1 }).startOf("day");
  return lockAt.toJSDate();
}

export function computeGraceEndsAt(lockAt: Date): Date {
  return DateTime.fromJSDate(lockAt).plus({ hours: GRACE_PERIOD_HOURS }).toJSDate();
}
