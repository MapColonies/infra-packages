/**
 * @public
 */
export interface TelemetryBase<T> {
  start: () => T;
  stop: () => Promise<void>;
}
