/**
 * Middlewares for integerting prometheus into express based applications
 * @module Metrics Middlewares
 */
import { hostname as osHostname } from 'node:os';
import { Registry, collectDefaultMetrics, Gauge } from 'prom-client';
import promBundle, { Labels } from 'express-prom-bundle';
import { readPackageJsonSync } from '@map-colonies/read-pkg';
import * as express from 'express';
import { get } from 'lodash';
import { deconstructSemver } from './util';

/**
 * Options for configuring metrics middleware.
 */
export interface Opts {
  /**
   * The Prometheus registry to use for the metrics.
   */
  registry: Registry;
  /**
   * Whether to collect node metrics.
   */
  collectNodeMetrics: boolean;
  /**
   * Whether to collect service version metrics.
   */
  collectServiceVersion: boolean;
  /**
   * The prefix for the metrics.
   * e.g. 'my_prefix_my_metric'
   */
  prefix: string;
  /**
   * Add operation id based on the Openapi operationId to the metrics.
   * Requires the {@link https://www.npmjs.com/package/express-openapi-validator | express-openapi-validator} package to function.
   * @default true
   */
  includeOperationId: boolean;
  /**
   * The labels to attach to all the metrics.
   */
  labels: Record<string, string>;
  /**
   * Object containing extra labels, useful together with transformLabels.
   */
  customLabels: Exclude<promBundle.Opts['customLabels'], undefined>;
  /**
   * Function to transform labels with request and response objects.
   */
  transformLabels?: promBundle.Opts['transformLabels'];
}

/**
 * Express middleware that returns the metrics collected by the registry.
 *
 * @param registry - The metrics registry.
 * @param shouldCollectDefaultMetrics - Indicates whether to collect default metrics. Default is `true`.
 * @param defaultMetricsPrefix - The prefix to be added to default metrics.
 * @param defaultMetricsLabels - The labels to be added to default metrics.
 * @returns The Express request handler function.
 */
export function metricsMiddleware(
  registry: Registry,
  shouldCollectDefaultMetrics = true,
  defaultMetricsPrefix?: string,
  defaultMetricsLabels?: Record<string, string>
): express.RequestHandler {
  if (shouldCollectDefaultMetrics) {
    collectDefaultMetrics({ prefix: defaultMetricsPrefix, register: registry, labels: defaultMetricsLabels });
  }
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    registry
      .metrics()
      .then((metrics) => {
        res.set('Content-Type', registry.contentType);
        res.end(metrics);
      })
      .catch((error) => {
        next(error);
      });
  };
}

/**
 * Collects metrics for Express middleware.
 * The metrics collected include statistics on request duration.
 *
 * @param options - Optional configuration options for the middleware.
 * @returns The Express middleware function that collects metrics.
 */
export function collectMetricsExpressMiddleware(options: Partial<Opts>): promBundle.Middleware {
  const packageInfo = readPackageJsonSync();
  const defaultOpts = {
    prefix: '',
    labels: {},
    includeOperationId: true,
    collectNodeMetrics: true,
    collectServiceVersion: true,
    registry: new Registry(),
    customLabels: {} as Opts['customLabels'],
  } satisfies Opts;

  const mergedOptions = { ...defaultOpts, ...options };

  /* eslint-disable @typescript-eslint/naming-convention */
  const mergedLabels: promBundle.Opts['customLabels'] = {
    hostname: osHostname(),
    service_name: packageInfo.name,
    ...mergedOptions.labels,
  };

  mergedOptions.registry.setDefaultLabels(mergedLabels);

  if (mergedOptions.collectNodeMetrics) {
    collectDefaultMetrics({ prefix: mergedOptions.prefix, register: mergedOptions.registry });
  }

  if (mergedOptions.collectServiceVersion) {
    const gaugeLabels = ['service_version_major', 'service_version_minor', 'service_version_patch', 'service_version_prerelease'];
    const semver = deconstructSemver(packageInfo.version ?? '0.0.0');
    if (!semver) {
      throw new Error('package.json includes version not according to semver spec');
    }
    const { major, minor, patch, prerelease } = semver;
    const serviceVersionGauge = new Gauge({
      name: `${mergedOptions.prefix ? `${mergedOptions.prefix}_` : ''}service_version`,
      help: 'Service Version Specified in package.json file',
      labelNames: gaugeLabels,
      registers: [mergedOptions.registry],
    });

    /* eslint-disable @typescript-eslint/naming-convention */
    const versionLabels: Record<string, string> = {
      service_version_major: major,
      service_version_minor: minor,
      service_version_patch: patch,
    };

    if (prerelease !== undefined) {
      versionLabels.service_version_prerelease = prerelease;
    }
    /* eslint-enable @typescript-eslint/naming-convention */
    serviceVersionGauge.set(versionLabels, 1);
  }

  let transformLabels = mergedOptions.transformLabels;

  if (mergedOptions.includeOperationId) {
    const operationIdLabel = 'operation';
    mergedOptions.customLabels[operationIdLabel] = null;

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (!transformLabels) {
      transformLabels = (customLabels: Labels, req: express.Request, res: express.Response): void => {
        const operationId = get(req, 'openapi.schema.operationId') as string | undefined;
        if (typeof operationId == 'string') {
          customLabels[operationIdLabel] = operationId;
        }

        if (mergedOptions.transformLabels) {
          mergedOptions.transformLabels(customLabels, req, res);
        }
      };
    }
  }

  const promBundleConfig: promBundle.Opts = {
    promRegistry: mergedOptions.registry,
    autoregister: true,
    includeUp: false,
    customLabels: mergedOptions.customLabels,
    includeMethod: true,
    includeStatusCode: true,
    includePath: false,
    transformLabels,
  };
  return promBundle(promBundleConfig);
}
