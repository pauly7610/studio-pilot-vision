/**
 * Linear regression forecasting utilities
 * Calculates trend lines, predictions, and confidence intervals
 */

export interface DataPoint {
  x: number; // time index
  y: number; // value
}

export interface ForecastResult {
  predictions: Array<{ x: number; y: number; upper: number; lower: number }>;
  slope: number;
  intercept: number;
  r2: number; // coefficient of determination
}

/**
 * Perform simple linear regression on time-series data
 */
export function linearRegression(dataPoints: DataPoint[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = dataPoints.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  // Calculate means
  const meanX = dataPoints.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = dataPoints.reduce((sum, p) => sum + p.y, 0) / n;

  // Calculate slope (β1) and intercept (β0)
  let numerator = 0;
  let denominator = 0;

  for (const point of dataPoints) {
    const xDiff = point.x - meanX;
    const yDiff = point.y - meanY;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Calculate R² (coefficient of determination)
  let ssRes = 0; // residual sum of squares
  let ssTot = 0; // total sum of squares

  for (const point of dataPoints) {
    const predicted = slope * point.x + intercept;
    ssRes += Math.pow(point.y - predicted, 2);
    ssTot += Math.pow(point.y - meanY, 2);
  }

  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

/**
 * Calculate standard error of the estimate
 */
function calculateStandardError(
  dataPoints: DataPoint[],
  slope: number,
  intercept: number
): number {
  const n = dataPoints.length;
  if (n <= 2) return 0;

  let sumSquaredErrors = 0;
  for (const point of dataPoints) {
    const predicted = slope * point.x + intercept;
    sumSquaredErrors += Math.pow(point.y - predicted, 2);
  }

  return Math.sqrt(sumSquaredErrors / (n - 2));
}

/**
 * Forecast future values with confidence intervals
 * @param historicalData - Array of historical data points
 * @param periodsAhead - Number of periods to forecast
 * @param confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 */
export function forecastWithConfidence(
  historicalData: Array<{ value: number }>,
  periodsAhead: number = 3,
  confidenceLevel: number = 0.95
): ForecastResult {
  // Convert to data points with x as index
  const dataPoints: DataPoint[] = historicalData.map((item, index) => ({
    x: index,
    y: item.value || 0,
  }));

  const { slope, intercept, r2 } = linearRegression(dataPoints);
  const standardError = calculateStandardError(dataPoints, slope, intercept);

  // t-value for confidence interval (approximation for 95% = 1.96)
  const tValue = confidenceLevel === 0.95 ? 1.96 : 2.58; // 95% or 99%

  // Generate predictions
  const predictions = [];
  const lastIndex = dataPoints.length - 1;

  for (let i = 1; i <= periodsAhead; i++) {
    const x = lastIndex + i;
    const predicted = slope * x + intercept;

    // Calculate confidence interval
    // Wider intervals for predictions further in the future
    const predictionError = standardError * Math.sqrt(1 + 1 / dataPoints.length + Math.pow(x - lastIndex, 2));
    const margin = tValue * predictionError;

    predictions.push({
      x,
      y: Math.max(0, predicted), // Ensure non-negative predictions
      upper: Math.max(0, predicted + margin),
      lower: Math.max(0, predicted - margin),
    });
  }

  return {
    predictions,
    slope,
    intercept,
    r2,
  };
}

/**
 * Calculate growth velocity (percentage change per period)
 */
export function calculateGrowthVelocity(
  dataPoints: Array<{ value: number }>
): { velocity: number; trend: "accelerating" | "decelerating" | "stable" } {
  if (dataPoints.length < 2) {
    return { velocity: 0, trend: "stable" };
  }

  const recent = dataPoints.slice(-3); // Last 3 periods
  const older = dataPoints.slice(-6, -3); // Previous 3 periods

  if (recent.length === 0 || older.length === 0) {
    return { velocity: 0, trend: "stable" };
  }

  const recentAvg = recent.reduce((sum, p) => sum + (p.value || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, p) => sum + (p.value || 0), 0) / older.length;

  const velocity = olderAvg !== 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  // Determine if growth is accelerating or decelerating
  const recentGrowth = recent.length >= 2 ? recent[recent.length - 1].value - recent[0].value : 0;
  const olderGrowth = older.length >= 2 ? older[older.length - 1].value - older[0].value : 0;

  let trend: "accelerating" | "decelerating" | "stable" = "stable";
  if (Math.abs(recentGrowth) > Math.abs(olderGrowth) * 1.1) {
    trend = "accelerating";
  } else if (Math.abs(recentGrowth) < Math.abs(olderGrowth) * 0.9) {
    trend = "decelerating";
  }

  return { velocity, trend };
}
