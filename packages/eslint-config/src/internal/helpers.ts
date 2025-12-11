export async function importOrThrow<T extends object>(modulePath: string): Promise<T> {
  try {
    const imported = (await import(modulePath)) as T;

    if ('default' in imported) {
      return imported.default as T;
    }
    return imported;
  } catch (error) {
    throw new Error(`Failed to import optional module '${modulePath}', make sure its installed and try again`, { cause: error });
  }
}
