export const PALETTE = {
  '.': 'transparent',
  B: '#1a1a1a',
  W: '#ffffff',
  G: '#ff9820',
  S: '#c86010',
  P: '#ff6888',
  I: '#ffa8b8',
  H: '#ff6b8a',
};

export function gridToPixels(rows, scale = 4) {
  const height = rows.length;
  const width = rows[0].length;
  const pixels = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = PALETTE[ch];
      if (color && color !== 'transparent') {
        pixels.push({ x, y, color });
      }
    });
  });
  return { pixels, width, height, scale };
}
