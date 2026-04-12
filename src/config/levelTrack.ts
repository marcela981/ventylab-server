/**
 * Curriculum track ids for Level.track — separates main respiratory path from Ventylab platform learning.
 */
export const LEVEL_TRACK = {
  MECANICA: 'mecanica',
  VENTYLAB: 'ventylab',
} as const;

export type LevelTrackId = (typeof LEVEL_TRACK)[keyof typeof LEVEL_TRACK];

export const DEFAULT_LEVEL_TRACK: LevelTrackId = LEVEL_TRACK.MECANICA;

export const LEVEL_TRACK_VALUES: LevelTrackId[] = [
  LEVEL_TRACK.MECANICA,
  LEVEL_TRACK.VENTYLAB,
];

export function isLevelTrack(value: string): value is LevelTrackId {
  return (LEVEL_TRACK_VALUES as string[]).includes(value);
}
