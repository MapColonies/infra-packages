# Prettier config

Shared Prettier configuration for MapColonies projects. This package provides a consistent code formatting style across our repositories.

## Description

This configuration extends Prettier's default settings with MapColonies' preferred styling choices:

- Single quotes
- 2 spaces indentation
- 150 characters line length
- ES5 trailing commas
- LF line endings
- Semicolons enforced

## Installation

```bash
npm install --save-dev @mapcolonies/prettier-config
```

## Usage

Add the configuration using one of these methods:

1. Add to your `package.json`:

```json
{
  "prettier": "@map-colonies/prettier-config"
}
```

2. Create a `.prettierrc` JSON file:

```json
"@map-colonies/prettier-config"
```

3. If you need to customize some options, create a `.prettierrc.js` file:

```javascript
module.exports = {
  ...require("@map-colonies/prettier-config"),
  // your overrides here
};
```

## Useful Links

- [Prettier Official Website](https://prettier.io)
- [Prettier GitHub Repository](https://github.com/prettier/prettier)
- [Prettier Configuration Options](https://prettier.io/docs/en/options.html)
- [Prettier Shared Configurations](https://prettier.io/docs/en/sharing-configurations)
