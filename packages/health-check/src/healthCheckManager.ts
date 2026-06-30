import type { Server } from 'node:http';
import { createTerminus, type TerminusOptions } from '@godaddy/terminus';
import type { Logger } from '@map-colonies/js-logger';

const CHECK_INTERVAL_MS = 1000;

/** @public */
export type HealthCheckFunction = () => Promise<void>;

/** @public */
export class HealthCheckManager {
  private readonly livenessChecks: Record<string, HealthCheckFunction> = {};
  private readonly readinessChecks: Record<string, HealthCheckFunction> = {};
  private readonly shutdownHooks: Record<string, HealthCheckFunction> = {};
  private readonly logger: Logger;
  private ready = true;
  private readonly server: Server;
  private activeRequestsCount = 0;

  public constructor(server: Server, logger: Logger, terminusOptions?: TerminusOptions) {
    this.logger = logger;
    this.server = server;

    this.server.on('request', (req, res) => {
      this.activeRequestsCount++;
      res.on('close', () => {
        this.activeRequestsCount--;
      });
    });

    const defaultSignals = ['SIGINT', 'SIGTERM'];

    this.registerReadinessCheck('default', async () => {
      await Promise.resolve();
      if (!this.ready) {
        throw new Error('App is not ready');
      }
    });

    const healthChecks: Record<string, () => Promise<void>> = {
      '/liveness': async (): Promise<void> => {
        await Promise.all(
          Object.entries(this.livenessChecks).map(async ([name, check]) => {
            try {
              await check();
            } catch (error) {
              this.logger.error({ msg: `Liveness check failed: ${name}`, err: error });
              throw error;
            }
          })
        );
      },
      '/readiness': async (): Promise<void> => {
        await Promise.all(
          Object.entries(this.readinessChecks).map(async ([name, check]) => {
            try {
              await check();
            } catch (error) {
              this.logger.error({ msg: `Readiness check failed: ${name}`, err: error });
              throw error;
            }
          })
        );
      },
    };

    const newTerminusOptions: TerminusOptions = {
      signals: defaultSignals,
      ...terminusOptions,
      healthChecks: {
        ...healthChecks,
        ...(terminusOptions?.healthChecks ?? {}),
      },
      onSignal: async (): Promise<void> => {
        if (terminusOptions?.onSignal) {
          await terminusOptions.onSignal();
        }
        await Promise.all(
          Object.entries(this.shutdownHooks).map(async ([name, hook]) => {
            try {
              this.logger.info(`Running shutdown hook: ${name}`);
              await hook();
            } catch (err) {
              this.logger.error({ msg: `Shutdown hook failed: ${name}`, err });
            }
          })
        );
      },
      logger: (msg: string, error: Error): void => {
        this.logger.error({ err: error, msg });
        if (terminusOptions?.logger) {
          terminusOptions.logger(msg, error);
        }
      },
    };

    createTerminus(this.server, newTerminusOptions);
  }

  public get isReady(): boolean {
    return this.ready;
  }

  public setReady(state: boolean): void {
    this.ready = state;
  }

  public getActiveRequestsCount(): number {
    return this.activeRequestsCount;
  }

  public async waitUntilZeroActiveRequests(checkIntervalMs = CHECK_INTERVAL_MS): Promise<void> {
    const sleep = async (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
    while (this.getActiveRequestsCount() > 0) {
      await sleep(checkIntervalMs);
    }
  }

  public registerLivenessCheck(name: string, check: HealthCheckFunction): void {
    this.livenessChecks[name] = check;
  }

  public registerReadinessCheck(name: string, check: HealthCheckFunction): void {
    this.readinessChecks[name] = check;
  }

  public registerShutdownHook(name: string, hook: HealthCheckFunction): void {
    this.shutdownHooks[name] = hook;
  }
}
