export function deconstructSemver(
  semverString: string
): { major: string; minor: string; patch: string; prerelease: string | undefined; build: string | undefined } | null {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([\w-]+))?(?:\+([\w-]+))?/i.exec(semverString);
  if (!match) {
    return null;
  }
  return {
    major: match[1] ?? 'undefined',
    minor: match[2] ?? 'undefined',
    patch: match[3] ?? 'undefined',
    prerelease: match[4],
    build: match[5],
  };
}
