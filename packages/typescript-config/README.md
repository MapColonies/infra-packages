# tsconfig

> Shared TypeScript config for MapColonies

## Install

```bash
npm install --save-dev @map-colonies/tsconfig
```

The config requires [TypeScript](https://www.typescriptlang.org/) 5.5 or later.

## Usage

`tsconfig.json`

```json
{
  "extends": "@map-colonies/tsconfig/<wanted tsconfig file>"
}
```

## Available files

- `tsconfig-app.json` - For use in services like ts-server-boilerplate
- `tsconfig-library.json` - For use in libraries published to npm
- `tsconfig-base.json` - The base tsconfig file

## Resources

- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig)
- [What is a tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
