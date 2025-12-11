# ESLint config

A collection of [ESLint](https://eslint.org/) configs for various frameworks and environments.
The package only supports eslint 9 and above using the flat configuration.

## Available Configs

- **ts-base**: base configurations for TypeScript.
- **React**: rules for React (extends react-app).
- **Jest**: rules for Jest.

## Installation

### base
```bash
$ npm install --save-dev eslint @map-colonies/eslint-config
```

### react
```
$ npm install --save-dev @map-colonies/eslint-config eslint-plugin-react eslint-plugin-react-hooks
```

### jest
```
$ npm install --save-dev @map-colonies/eslint-config eslint-plugin-jest
```


## Usage

Add the configs you want to the eslint configuration file of your choice. In this example we are using the file `eslint.config.mjs`
For more information check the following link [Configuration Files
](https://eslint.org/docs/latest/use/configure/configuration-files).
<br/>
**Note:** make sure to add `ts-base` last.

```javascript
import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import { config } from '@map-colonies/eslint-config/helpers';

export default config(tsBaseConfig);

```

## Debug
If you want to check the ESLint configuration, debug problems or just see the final configuration, you can the following command that will open the eslint configuration UI in your browser.

```bash
npx eslint --inspect-config .
```

For more information check the following link [debug](https://eslint.org/docs/latest/use/configure/debug).


## Adding new Configs

Add a new file and name it as you would like. Inside export the ESLint configuration.

```js
module.exports = {
  extends: ['plugin:jest/recommended', 'plugin:jest/style'],
  plugins: ['jest'],
  env: {
    'jest/globals': true,
  },
};
```

after you finished developing the config, make sure it works by using the `--print-config` flag of ESLint, in the project you use for testing.

```bash
$ npx eslint --print-config index.ts
```

Don't forget adding the config to this readme :blush:

## Issues
If any linting error is appearing twice, or you have any other problem, please open an issue with all the details you have.
