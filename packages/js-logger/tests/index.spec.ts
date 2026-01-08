import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { jsLogger } from '../src';
import { waitForFileCreation } from './helpers';

describe('jsLogger', function () {
  it('should initialize the logger without errors', function () {
    const logger = jsLogger();

    expect(logger).toBeDefined();
    expect(() => logger.info('test')).not.toThrow();
  });

  it('should support other destinations', async function () {
    const logger = jsLogger({}, 'avi.log');

    logger.info('avi');

    // Wait for the log to be written
    await waitForFileCreation('avi.log');

    const logLine = JSON.parse(readFileSync('avi.log', { encoding: 'utf-8' })) as Record<string, string>;
    expect(logLine).toHaveProperty('msg', 'avi');
  });

  it('should support base option', async function () {
    const logger = jsLogger({ base: { key: 'value' } }, 'avi-base.log');

    logger.info('avi');

    // Wait for the log to be written
    await waitForFileCreation('avi-base.log');

    const logLine = JSON.parse(readFileSync('avi-base.log', { encoding: 'utf-8' })) as Record<string, string>;

    expect(logLine).toHaveProperty('msg', 'avi');
    expect(logLine).toHaveProperty('key', 'value');
  });

  it('should include caller information if enabled', async function () {
    const logger = jsLogger({ pinoCaller: true }, 'avi-caller.log');

    logger.info('avi');

    // Wait for the log to be written
    await waitForFileCreation('avi-caller.log');

    const logLine = JSON.parse(readFileSync('avi-caller.log', { encoding: 'utf-8' })) as Record<string, string>;

    expect(logLine).toHaveProperty('msg', 'avi');
    expect(logLine).toHaveProperty('caller');
  });

  it('should still output logs when opentelemetry is enabled', function () {
    const logger = jsLogger({ opentelemetryOptions: { enabled: true } });

    expect(logger).toBeDefined();
    expect(() => logger.info('test otel')).not.toThrow();
  });
});
