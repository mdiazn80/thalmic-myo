export function quaternionToEuler(q: number[]) {
  const [w, x, y, z] = q;
  const roll =
    Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)) *
    (180 / Math.PI);
  const sinp = 2 * (w * y - z * x);
  const pitch =
    Math.abs(sinp) >= 1
      ? Math.sign(sinp) * 90
      : Math.asin(sinp) * (180 / Math.PI);
  const yaw =
    Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)) *
    (180 / Math.PI);
  return { roll, pitch, yaw };
}

export const fmt = (v: number) => v.toFixed(1);
