import type { TestProject } from 'vitest/node';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const POSTGRES_IMAGE = 'postgres:15';

declare module 'vitest' {
  export interface ProvidedContext {
    pgHost: string;
    pgPort: number;
    pgDatabase: string;
    pgUsername: string;
    pgPassword: string;
  }
}

export async function setup(project: TestProject): Promise<void> {
  let container = new PostgreSqlContainer(POSTGRES_IMAGE);

  if (process.env.CI === undefined) {
    container = container.withReuse();
  }

  const startedContainer = await container.start();

  project.provide('pgHost', startedContainer.getHost());
  project.provide('pgPort', startedContainer.getPort());
  project.provide('pgDatabase', startedContainer.getDatabase());
  project.provide('pgUsername', startedContainer.getUsername());
  project.provide('pgPassword', startedContainer.getPassword());
}
