/**
 * Thrown when the same field appears more than once in a sort query array.
 * @public
 */
export class SortQueryRepeatError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SortQueryRepeatError.prototype);
  }
}

/**
 * Thrown when a sort query references a field that is not present in the provided fields map.
 * @public
 */
export class SortQueryInvalidFieldError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SortQueryInvalidFieldError.prototype);
  }
}

/**
 * A map of entity keys to their requested sort direction.
 * @public
 */
export type SortOptions<T extends object> = {
  [key in keyof T]?: 'asc' | 'desc';
};

/**
 * Parses an array of `"field:order"` sort strings into a {@link SortOptions} object.
 *
 * Each entry must follow the format `"fieldName"` (defaults to `asc`) or `"fieldName:asc"` / `"fieldName:desc"`.
 * The `fieldName` is looked up in `sortFieldsMap` and mapped to the corresponding entity key.
 *
 * @param sortArray - Array of sort strings, or `undefined` to return an empty result.
 * @param sortFieldsMap - Map from external field names (e.g., query-string names) to entity object keys.
 * @returns A {@link SortOptions} object keyed by entity property.
 * @throws {@link SortQueryRepeatError} When the same field appears more than once.
 * @throws {@link SortQueryInvalidFieldError} When a field is not found in `sortFieldsMap`.
 * @public
 */
export function sortOptionParser<T extends object>(sortArray: string[] | undefined, sortFieldsMap: Map<string, keyof T>): SortOptions<T> {
  if (!sortArray) {
    return {};
  }

  const parsedOptions: SortOptions<T> = {};
  const fieldSet = new Set<string>();

  for (const option of sortArray) {
    const [field, order] = option.split(':') as [string, 'asc' | 'desc' | undefined]; // we assume that the options are already validated by the openapi validator;

    if (fieldSet.has(field)) {
      throw new SortQueryRepeatError(`Duplicate field in sort query: ${field}`);
    }
    fieldSet.add(field);

    const parsedField = sortFieldsMap.get(field);

    if (parsedField === undefined) {
      throw new SortQueryInvalidFieldError(`Invalid field in sort query: ${field}`);
    }

    parsedOptions[parsedField] = order ?? 'asc';
  }

  return parsedOptions;
}
