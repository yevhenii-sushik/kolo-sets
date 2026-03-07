/**
 * Kolo Sets Registry
 *
 * To add a new set:
 * 1. Create a file in src/data/kolo-sets/ following the naming convention:
 *    {language}-{level}-{topic-slug}.ts  →  e.g. en-b2-business.ts
 * 2. Import it here and add to the KOLO_SETS array.
 * 3. That's it — it will appear automatically in the WordsPage Kolo Sets tab.
 */

import { KoloSet } from '../../types/kolo-sets';

import a0Basics   from './en-a0-basics';
import a0Home     from './en-a0-home';
import a1Everyday from './en-a1-everyday';
import b1Travel   from './en-b1-travel';

export const KOLO_SETS: KoloSet[] = [
  a0Basics,
  a0Home,
  a1Everyday,
  b1Travel,
  // ↓ Add new sets below this line
];

// Helpers
export const KOLO_SETS_BY_LEVEL = KOLO_SETS.reduce<Record<string, KoloSet[]>>(
  (acc, set) => {
    if (!acc[set.level]) acc[set.level] = [];
    acc[set.level].push(set);
    return acc;
  },
  {}
);

export const CEFR_ORDER = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
