import { gridToPixels } from './palette';

const HEART = [
  '........',
  '..HH..HH',
  '.HHHHHHH',
  '.HHHHHHH',
  '..HHHHH.',
  '...HHH..',
  '....H...',
  '........',
];

export function getHeartSprite() {
  return gridToPixels(HEART, 3);
}
