# commitlint-config
Common commitlint configuration for MapColonies projects

## Installation
To install the package run the following command:
```bash
npm install --save-dev @mapcolonies/commitlint-config
```

## Usage
To use the package, create a `commitlint.config.js` file in the root of your project and add the following code:
```javascript
module.exports = {
  extends: ['@mapcolonies/commitlint-config'],
};
```

## Rules
This package extends all the rules from the `@commitlint/config-conventional` package and adds the following rules:
1. The allowed values for the type parameters (feat,fix,chore..) are as follow: `deps`, `helm`, `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
