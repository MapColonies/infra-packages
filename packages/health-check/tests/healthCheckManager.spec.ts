import { createServer } from 'node:http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TerminusOptions } from '@godaddy/terminus';
import type { Logger } from '@map-colonies/js-logger';
import { HealthCheckManager } from '../src/healthCheckManager';

const mockCreateTerminus = vi.fn();

vi.mock('@godaddy/terminus', () => ({
  createTerminus: (server: unknown, options: TerminusOptions): unknown => mockCreateTerminus(server, options),
}));

describe('HealthCheckManager', () => {
  let manager: HealthCheckManager;
  let mockLogger: Logger;

  beforeEach(() => {
    mockCreateTerminus.mockClear();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;
  });

  it('should initialize and attach to terminus', () => {
    const server = createServer();

    expect(() => {
      manager = new HealthCheckManager(server, mockLogger);
    }).not.toThrow();

    expect(mockCreateTerminus).toHaveBeenCalledTimes(1);
    expect(mockCreateTerminus.mock.calls[0]![0]).toBe(server);
  });

  it('should run liveness checks via terminus options', async () => {
    // Arrange
    const checkFn = vi.fn().mockResolvedValue(undefined);
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.registerLivenessCheck('test-live', checkFn);

    // Act
    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    if (options.healthChecks?.['/liveness'] !== undefined) {
      const livenessCheck = options.healthChecks['/liveness'] as () => Promise<void>;
      await livenessCheck();
    }

    // Assert
    expect(checkFn).toHaveBeenCalledTimes(1);
  });

  it('should run readiness checks via terminus options', async () => {
    const checkFn = vi.fn().mockResolvedValue(undefined);
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.registerReadinessCheck('test', checkFn);

    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    if (options.healthChecks?.['/readiness'] !== undefined) {
      const readinessCheck = options.healthChecks['/readiness'] as () => Promise<void>;
      await readinessCheck();
    }

    expect(checkFn).toHaveBeenCalledTimes(1);
  });

  it('should run shutdown hooks via terminus options', async () => {
    const hookFn = vi.fn().mockResolvedValue(undefined);
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.registerShutdownHook('test', hookFn);

    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    if (options.onSignal !== undefined) {
      await options.onSignal();
    }

    // Assert
    expect(hookFn).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith('Running shutdown hook: test');
  });

  it('should log and rethrow when a readiness check fails', async () => {
    // Arrange
    const error = new Error('DB Down');
    const checkFn = vi.fn().mockRejectedValue(error);
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.registerReadinessCheck('db', checkFn);

    // Act & Assert
    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    const readinessCheck = options.healthChecks?.['/readiness'] as () => Promise<void>;

    await expect(readinessCheck()).rejects.toThrow('DB Down');
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error, msg: 'Readiness check failed: db' });
  });

  it('should log and rethrow when a liveness check fails', async () => {
    // Arrange
    const error = new Error('Memory leak');
    const checkFn = vi.fn().mockRejectedValue(error);
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.registerLivenessCheck('memory', checkFn);

    // Act & Assert
    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    const livenessCheck = options.healthChecks?.['/liveness'] as () => Promise<void>;

    await expect(livenessCheck()).rejects.toThrow('Memory leak');
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error, msg: 'Liveness check failed: memory' });
  });

  it('should log and NOT throw when a shutdown hook fails', async () => {
    // Arrange
    const error = new Error('Close failed');
    const hookFn = vi.fn().mockRejectedValue(error);
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.registerShutdownHook('cache', hookFn);

    // Act
    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    await options.onSignal?.();

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error, msg: 'Shutdown hook failed: cache' });
  });

  it('should fail default readiness check if setReady(false) is called', async () => {
    // Arrange
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);
    manager.setReady(false);

    // Act & Assert
    const options = mockCreateTerminus.mock.calls[0]![1] as TerminusOptions;
    const readinessCheck = options.healthChecks?.['/readiness'] as () => Promise<void>;

    await expect(readinessCheck()).rejects.toThrow('App is not ready');
  });

  it('should return active requests count by listening to server requests', () => {
    // Arrange
    const server = createServer();
    manager = new HealthCheckManager(server, mockLogger);

    // Act
    // Simulate a request
    let requestHandler: ((req: unknown, res: unknown) => void) | undefined;
    server.listeners('request').forEach((listener) => {
      requestHandler = listener as unknown as (req: unknown, res: unknown) => void;
    });

    if (requestHandler) {
      const mockReq = {};
      const mockRes = {
        on: vi.fn(),
      };
      requestHandler(mockReq, mockRes);
    }

    const count = manager.getActiveRequestsCount();

    // Assert
    expect(count).toBe(1);
  });
});
