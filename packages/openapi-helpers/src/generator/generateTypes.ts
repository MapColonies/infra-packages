#!/usr/bin/env node
import fs from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import openapiTS, { astToString, SchemaObject, TransformNodeOptions, TransformObject } from 'openapi-typescript';
import { TypeNode } from 'typescript';

const ESLINT_DISABLE = '/* eslint-disable */\n';
const FILE_HEADER = `${ESLINT_DISABLE}// This file was auto-generated. Do not edit manually.
// To update, run the error generation script again.\n\n`;

const typedRequestHandlerImport =
  "import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';\n";
const exportTypedRequestHandlers = 'export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;\n';

/**
 * Generates TypeScript types from an OpenAPI specification file and writes them to the specified destination path.
 * @public
 */
export async function generateTypes(
  openapiPath: string,
  destinationPath: string,
  options: {
    shouldFormat?: boolean;
    addTypedRequestHandler?: boolean;
    inject?: string;
    transform?: (schemaObject: SchemaObject, metadata: TransformNodeOptions) => TypeNode | TransformObject | undefined;
  }
): Promise<void> {
  const ast = await openapiTS(await fs.readFile(openapiPath, 'utf-8'), { exportType: true, inject: options.inject, transform: options.transform });

  let content = astToString(ast);

  if (options.addTypedRequestHandler === true) {
    content = typedRequestHandlerImport + content + exportTypedRequestHandlers;
  }

  content = FILE_HEADER + content;

  if (options.shouldFormat === true) {
    const prettierOptions = await resolveConfig('./src/index.ts');

    content = await format(content, { ...prettierOptions, parser: 'typescript' });
  }

  await fs.writeFile(destinationPath, content);
}
