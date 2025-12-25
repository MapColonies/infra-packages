import { existsSync, statSync } from 'node:fs';
import { setInterval } from 'timers/promises';

export async function waitForFileCreation(path: string): Promise<void> {
  const abortController = new AbortController();
  const interval = 100;
  let iterations = 0;
  const maxIterations = 10;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const unusedValue of setInterval(interval, { signal: abortController.signal })) {
    iterations++;
    const fileExists = existsSync(path);
    if (fileExists && statSync(path).size > 0) {
      abortController.abort();
      break;
    }
    if (iterations >= maxIterations) {
      abortController.abort();
      throw new Error(`File ${path} was not created within ${maxIterations * interval}ms`);
    }
  }
}
