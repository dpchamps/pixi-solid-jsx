export const lerp = (start: number, end: number, percentage: number) =>
  start * (1 - percentage) + end * percentage;
