/**
 * MONITORING & METRICS UTILITY
 * CloudWatch Embedded Metric Format (EMF) for zero-cost custom metrics
 * AWS Lambda'da PutMetricData API çağrısı yapmadan CloudWatch metrikleri
 */

interface MetricLog {
  _aws: {
    Timestamp: number;
    CloudWatchMetrics: Array<{
      Namespace: string;
      Dimensions: string[][];
      Metrics: Array<{
        Name: string;
        Unit: string;
      }>;
    }>;
  };
  [key: string]: any;
}

const NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || 'AtusHome/API';

/**
 * Log a custom metric using EMF (Embedded Metric Format)
 * Bu log satırı CloudWatch Logs'a düştüğünde otomatik metrik oluşur
 * Ekstra API çağrısı ve maliyet yoktur
 */
export function logMetric(
  name: string,
  value: number,
  unit: 'Seconds' | 'Milliseconds' | 'Count' | 'Percent' = 'Count',
  dimensions: Record<string, string> = {}
): void {
  const metric: MetricLog = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: NAMESPACE,
          Dimensions: [Object.keys(dimensions)],
          Metrics: [{ Name: name, Unit: unit }],
        },
      ],
    },
    [name]: value,
    ...dimensions,
    service: 'atushome-api',
    environment: process.env.NODE_ENV || 'production',
  };

  console.log(JSON.stringify(metric));
}

/**
 * Record API latency
 */
export function logLatency(operation: string, durationMs: number): void {
  logMetric('Latency', durationMs, 'Milliseconds', { Operation: operation });
}

/**
 * Record error
 */
export function logError(
  error: Error | string,
  context: Record<string, any> = {}
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  logMetric('ErrorCount', 1, 'Count', { ErrorType: errorName, ...context });

  console.error(
    JSON.stringify({
      level: 'error',
      errorType: errorName,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Record business event (orders, payments, etc.)
 */
export function logBusinessEvent(
  eventType: string,
  value: number = 1,
  dimensions: Record<string, string> = {}
): void {
  logMetric('BusinessEvent', value, 'Count', { EventType: eventType, ...dimensions });
}

/**
 * Simple timer helper
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
