const { createDefaultEsmPreset } = require('ts-jest');

const presetConfig = createDefaultEsmPreset({
  tsconfig: 'tsconfig.spec.json',
});

module.exports = {
  testEnvironment: 'node',

  ...presetConfig,

  // If your TS uses NodeNext-style imports like `../foo.js`,
  // this lets Jest resolve them against the TS sources.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  testMatch: ['**/?(*.)+(test|spec).ts'],

  setupFiles: ["<rootDir>/src/test/jest.setup.ts"]
};
