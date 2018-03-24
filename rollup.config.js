import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    format: 'iife',
    file: 'dist/index.js',
    name: 'ppstream',
    sourcemap: true
  },
  plugins: [
    commonjs({
      include: 'node_modules/**'
    }),
    nodeResolve({
      main: true
    }),
    babel({
      sourceMap: true,
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [["es2015", { "modules": false }], "stage-2"],
      plugins: ['external-helpers'],
      externalHelpers: true
    })
  ]
};
