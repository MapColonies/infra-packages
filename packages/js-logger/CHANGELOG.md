# Changelog

## [6.0.0](https://github.com/MapColonies/infra-packages/compare/js-logger-v5.0.0...js-logger-v6.0.0) (2026-07-23)


### ⚠ BREAKING CHANGES

* **eslint-config,eslint-plugin:** upgrade to eslint 10 MAPCO-9990 ([#231](https://github.com/MapColonies/infra-packages/issues/231))
* **js-logger:** added ability to define k8s resource attributes ([#161](https://github.com/MapColonies/infra-packages/issues/161))
* **eslint-config:** added unicorn rules ([#130](https://github.com/MapColonies/infra-packages/issues/130))
* **js-logger:** changed node engine to 24
* **js-logger:** added and changed from default to named export MAPCO-9031 ([#7](https://github.com/MapColonies/infra-packages/issues/7))

### 🎉 Features

* **eslint-config,eslint-plugin:** upgrade to eslint 10 MAPCO-9990 ([#231](https://github.com/MapColonies/infra-packages/issues/231)) ([a4a04b9](https://github.com/MapColonies/infra-packages/commit/a4a04b95b381813fa39b495c5a7aa37dca3d3c2b))
* **eslint-config:** added unicorn rules ([#130](https://github.com/MapColonies/infra-packages/issues/130)) ([b474787](https://github.com/MapColonies/infra-packages/commit/b474787ebefaddc521c56d2d775632d6c15d275c))
* **js-logger:** added ability to define k8s resource attributes ([#161](https://github.com/MapColonies/infra-packages/issues/161)) ([b5cdfca](https://github.com/MapColonies/infra-packages/commit/b5cdfca43c7734b6c0a7bd983f6017b2d3fbcf95))
* **js-logger:** added and changed from default to named export MAPCO-9031 ([#7](https://github.com/MapColonies/infra-packages/issues/7)) ([6361599](https://github.com/MapColonies/infra-packages/commit/63615998d54632cbf8b94657a9ee5bceeb12f0f3))
* **js-logger:** changed node engine to 24 ([86deacb](https://github.com/MapColonies/infra-packages/commit/86deacba46c67d667b1795e4c6bcde5148bb14c7))
* **js-logger:** enhance async logger initialization and kept log format when otel is enabled ([#261](https://github.com/MapColonies/infra-packages/issues/261)) ([dbcc44a](https://github.com/MapColonies/infra-packages/commit/dbcc44a80913c61f9800013f22552263539cc63f))
* **openapi-helpers:** added MAPCO-9027 ([#10](https://github.com/MapColonies/infra-packages/issues/10)) ([3f6a9e1](https://github.com/MapColonies/infra-packages/commit/3f6a9e1e6fcfc427342db12f6574ef5ad07083aa))
* **read-pkg:** added ([#8](https://github.com/MapColonies/infra-packages/issues/8)) ([851ded1](https://github.com/MapColonies/infra-packages/commit/851ded1559ebd5629a0a7b4413c8fa4f45797ce9))


### 🐛 Bug Fixes

* **js-logger:** removed formatter and added attributes so log parse correctly ([#151](https://github.com/MapColonies/infra-packages/issues/151)) ([482f709](https://github.com/MapColonies/infra-packages/commit/482f709522d604ddbc695e965405a91be05d3bbc))


### 🔗 Dependencies

* **js-logger:** update dependency pino-opentelemetry-transport to v3 ([#145](https://github.com/MapColonies/infra-packages/issues/145)) ([89e5d14](https://github.com/MapColonies/infra-packages/commit/89e5d140a4be0b3acf0e8d08bc25625bbe4d5c19))
* **js-logger:** update dependency pino-opentelemetry-transport to v4 ([#272](https://github.com/MapColonies/infra-packages/issues/272)) ([2b305b5](https://github.com/MapColonies/infra-packages/commit/2b305b53b6fcffbebd05cfe9f977516d6ab2fc96))


### 📝 Documentation

* **js-logger:** update README for async usage and alloy logs MAPCO-10939 ([#246](https://github.com/MapColonies/infra-packages/issues/246)) ([26c4b5c](https://github.com/MapColonies/infra-packages/commit/26c4b5c4feeadb3f913e04e4c22a7a6d8eb8aa16))

## [5.0.0](https://github.com/MapColonies/infra-packages/compare/js-logger-v4.1.0...js-logger-v5.0.0) (2026-03-08)


### ⚠ BREAKING CHANGES

* **js-logger:** added ability to define k8s resource attributes ([#161](https://github.com/MapColonies/infra-packages/issues/161))

### 🎉 Features

* **js-logger:** added ability to define k8s resource attributes ([#161](https://github.com/MapColonies/infra-packages/issues/161)) ([f48aaa4](https://github.com/MapColonies/infra-packages/commit/f48aaa4522b7987675308a1b3a1f5b692979534d))

## [4.1.0](https://github.com/MapColonies/infra-packages/compare/js-logger-v4.0.0...js-logger-v4.1.0) (2026-03-08)


### 🐛 Bug Fixes

* **js-logger:** removed formatter and added attributes so log parse correctly ([#151](https://github.com/MapColonies/infra-packages/issues/151)) ([482f709](https://github.com/MapColonies/infra-packages/commit/482f709522d604ddbc695e965405a91be05d3bbc))


### 🔧 Miscellaneous Chores

* **js-logger:** release 4.1.0 ([2a8a574](https://github.com/MapColonies/infra-packages/commit/2a8a574992a1cbf7f2b76f990ebfe436afb73ff5))

## [4.0.0](https://github.com/MapColonies/infra-packages/compare/js-logger-v3.0.2...js-logger-v4.0.0) (2026-01-18)


### ⚠ BREAKING CHANGES

* **js-logger:** changed node engine to 24
* **js-logger:** added and changed from default to named export MAPCO-9031 ([#7](https://github.com/MapColonies/infra-packages/issues/7))

### 🎉 Features

* **js-logger:** added and changed from default to named export MAPCO-9031 ([#7](https://github.com/MapColonies/infra-packages/issues/7)) ([6361599](https://github.com/MapColonies/infra-packages/commit/63615998d54632cbf8b94657a9ee5bceeb12f0f3))
* **js-logger:** changed node engine to 24 ([86deacb](https://github.com/MapColonies/infra-packages/commit/86deacba46c67d667b1795e4c6bcde5148bb14c7))
* **openapi-helpers:** added MAPCO-9027 ([#10](https://github.com/MapColonies/infra-packages/issues/10)) ([3f6a9e1](https://github.com/MapColonies/infra-packages/commit/3f6a9e1e6fcfc427342db12f6574ef5ad07083aa))
* **read-pkg:** added ([#8](https://github.com/MapColonies/infra-packages/issues/8)) ([851ded1](https://github.com/MapColonies/infra-packages/commit/851ded1559ebd5629a0a7b4413c8fa4f45797ce9))
