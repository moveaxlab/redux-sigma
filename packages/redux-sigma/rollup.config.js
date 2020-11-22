import ts from 'rollup-plugin-ts';
import autoExternal from 'rollup-plugin-auto-external';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.js',
      format: 'cjs',
    },
    external: ['redux-saga/effects'],
    plugins: [
      autoExternal(),
      ts({
        tsconfig: './tsconfig.build.json',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.es.js',
      format: 'es',
    },
    external: ['redux-saga/effects'],
    plugins: [
      autoExternal(),
      ts({
        tsconfig: './tsconfig.es-build.json',
        transpileOnly: true,
      }),
    ],
  },
];
