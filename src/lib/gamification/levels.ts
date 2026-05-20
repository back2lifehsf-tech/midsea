/**
 * Curva de niveles — cuadratica suave para que los primeros niveles sean rapidos.
 * Nivel N requiere totalCoin >= 100 * N * (N + 1) / 2.
 *
 * Nivel 1: 100  | Nivel 5: 1500 | Nivel 10: 5500 | Nivel 20: 21000
 */

export interface LevelInfo {
  level: number;
  coinIntoLevel: number;
  coinNeededForNext: number;
  progressPct: number;
}

export function totalCoinForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.round((100 * level * (level + 1)) / 2);
}

export function levelFromTotalCoin(total: number): LevelInfo {
  if (total <= 0) {
    return { level: 0, coinIntoLevel: 0, coinNeededForNext: 100, progressPct: 0 };
  }

  let level = 0;
  while (totalCoinForLevel(level + 1) <= total) {
    level += 1;
  }

  const floor = totalCoinForLevel(level);
  const ceil = totalCoinForLevel(level + 1);
  const into = total - floor;
  const needed = ceil - floor;

  return {
    level,
    coinIntoLevel: into,
    coinNeededForNext: needed,
    progressPct: Math.round((into / needed) * 100)
  };
}
