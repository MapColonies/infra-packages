import fs from 'node:fs/promises';
import { glob } from 'glob';

export async function teardown(): Promise<void> {
  const files = await glob('*.log');
  await Promise.all(files.map(async (file) => fs.unlink(file)));
}
