import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { generateTypes } from '../src/generator/generateTypes.js';

describe('generateTypes', () => {
  it('should generate types from openapi3.yaml', async () => {
    const openapiPath = path.join(__dirname, 'openapi3.yaml');
    const destinationPath = path.join(__dirname, 'test-types.d.ts');

    await generateTypes(openapiPath, destinationPath, { shouldFormat: true });

    const content = await fs.readFile(destinationPath, 'utf-8');
    expect(content).toContain('export type paths');

    await fs.unlink(destinationPath);
  });
});
