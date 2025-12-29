import fs from 'node:fs/promises';
import path from 'node:path';
import { dereference } from '@apidevtools/json-schema-ref-parser';
import { format, resolveConfig } from 'prettier';
import * as changeCase from 'change-case';
import type { OpenAPI3, OperationObject, ResponseObject, SchemaObject } from 'openapi-typescript';

const ESLINT_DISABLE = '/* eslint-disable */\n';
const FILE_HEADER = `${ESLINT_DISABLE}// This file was auto-generated. Do not edit manually.
// To update, run the error generation script again.\n\n`;

function createError(code: string): string {
  let className = changeCase.pascalCase(code);

  if (!className.endsWith('Error')) {
    className += 'Error';
  }

  return `export class ${className} extends Error {
  public readonly code = '${code}';
  /**
   * Creates an instance of ${className}.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
};\n`;
}

function buildErrorMapping(errorCodes: Set<string>): string {
  return Array.from(errorCodes)
    .map((code) => `'${code}': '${code}'`)
    .join(', ');
}

/**
 * Generates TypeScript error classes and an optional error mapping from an OpenAPI specification file and writes them to the specified destination path.
 * @public
 */
export async function generateErrors(
  openapiPath: string,
  destinationPath: string,
  options: {
    shouldFormat?: boolean;
    includeMapping?: boolean;
    includeErrorClasses?: boolean;
  }
): Promise<void> {
  const openapi = await dereference<OpenAPI3>(openapiPath);

  if (openapi.paths === undefined) {
    console.error('No paths found in the OpenAPI document.');
    process.exit(1);
  }

  const errorCodes = new Set<string>();

  function extractCodeFromSchema(schema: SchemaObject): void {
    // Handle direct code property
    if (schema.type === 'object' && schema.properties?.code) {
      const codeProperty = schema.properties.code as SchemaObject;

      // Handle enum values
      if (codeProperty.enum) {
        codeProperty.enum.map(String).forEach((code) => {
          errorCodes.add(code);
        });
      }
    }

    // Handle allOf combinations
    if (schema.allOf) {
      for (const subSchema of schema.allOf) {
        extractCodeFromSchema(subSchema as SchemaObject);
      }
    }

    // Handle oneOf combinations
    if (schema.oneOf) {
      for (const subSchema of schema.oneOf) {
        extractCodeFromSchema(subSchema as SchemaObject);
      }
    }

    // Handle anyOf combinations
    if (schema.anyOf) {
      for (const subSchema of schema.anyOf) {
        extractCodeFromSchema(subSchema as SchemaObject);
      }
    }
  }

  for (const [, methods] of Object.entries(openapi.paths)) {
    for (const [key, operation] of Object.entries(methods) as [string, OperationObject][]) {
      if (['servers', 'parameters'].includes(key)) {
        continue;
      }

      for (const [statusCode, response] of Object.entries(operation.responses ?? {}) as [string, ResponseObject][]) {
        if (statusCode.startsWith('2') || statusCode.startsWith('3')) {
          continue; // Skip successful and redirection responses
        }

        const schema = response.content?.['application/json']?.schema as SchemaObject | undefined;
        if (schema) {
          extractCodeFromSchema(schema);
        }
      }
    }
  }

  if (errorCodes.size === 0) {
    console.warn('No error codes found in the OpenAPI document.');
    process.exit(0);
  }
  let errorFile = FILE_HEADER;

  if (options.includeErrorClasses === true) {
    errorFile += errorCodes.values().map(createError).toArray().join('\n');
  }

  if (options.includeMapping === true) {
    errorFile += ` export const API_ERRORS_MAP = { ${buildErrorMapping(errorCodes)} } as const;\n`;
  }

  if (options.shouldFormat === true) {
    const prettierOptions = await resolveConfig('./src/index.ts');
    errorFile = await format(errorFile, { ...prettierOptions, parser: 'typescript' });
  }

  const directory = path.dirname(destinationPath);
  await fs.mkdir(directory, { recursive: true });

  await fs.writeFile(destinationPath, errorFile);
}
