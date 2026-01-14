import { mergeConfig, defineProject, defineConfig } from 'vitest/config';
import sharedConfig from 'vitest-config';

// export default mergeConfig(
//   sharedConfig,
//   defineProject({

//     test: {
//       root: __dirname,
//     },
//   })
// );

const v4Config = mergeConfig(
  sharedConfig,
  defineProject({
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
    test: {
      root: __dirname,
    },
  })
);

v4Config.test!.include = ['tests/decorators/v4.spec.ts'];

export default defineConfig({
  test: {
    projects: [
      v4Config,
      mergeConfig(
        sharedConfig,
        defineProject({
          root: __dirname,
          esbuild: {
            tsconfigRaw: {
              compilerOptions: {
                experimentalDecorators: false,
              },
            },
          },
          test: { exclude: ['tests/decorators/v4.spec.ts'] },
        })
      ),
    ],
  },
});
