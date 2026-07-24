import { gridToPixels } from './palette';

// Secret side — cat apprentice mode (ears, whiskers, :3)
const DIGITAL_ME_ALT = [
  '........................',
  '........BB......BB......',
  '.......BBBB....BBBB.....',
  '......BBBBBB..BBBBBB....',
  '.....BBBBWWBBBBWWBBBB...',
  '....BBBWWBWWBWWBWWBBB...',
  '....BBWWWWWWWWWWWWBB....',
  '....BBWWWBWWBWWWWWBB....',
  '....BBWWWWWWWWWWWWBB....',
  '.....BBWWWWWWWWWWBB.....',
  '......BBBBWWWWBBBB......',
  '.......BBBBBBBBBB.......',
  '......BBBBBBBBBBBB......',
  '.....BBBB......BBBB.....',
  '....BBBB........BBBB....',
  '...W.BBB..........BBB.W.',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

export function getDigitalMeAltSprite() {
  return gridToPixels(DIGITAL_ME_ALT, 5);
}
