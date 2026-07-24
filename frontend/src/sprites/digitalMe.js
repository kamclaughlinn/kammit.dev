import { gridToPixels } from './palette';

// High-contrast B&W pixel portrait — "Digital Me" style
const DIGITAL_ME = [
  '........................',
  '.........BBBB...........',
  '........BBBBBB..........',
  '.......BBBBBBBB.........',
  '......BBBBWWBBBB........',
  '.....BBBWWWWWWBBB.......',
  '....BBBWWBWWBWWBBB......',
  '....BBWWWWWWWWWWBB......',
  '....BBWWWWWWWWWWBB......',
  '....BBWWWWWWWWWWBB......',
  '.....BBWWWWWWWWBB.......',
  '......BBBBWWBBBB........',
  '.......BBBBBBBB.........',
  '......BBBBBBBBBB........',
  '.....BBBBBBBBBBBB.......',
  '....BBBB......BBBB......',
  '...BBBB........BBBB.....',
  '...BBB..........BBB.....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

export function getDigitalMeSprite() {
  return gridToPixels(DIGITAL_ME, 5);
}
