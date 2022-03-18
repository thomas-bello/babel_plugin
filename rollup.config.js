// 为了将引入的 npm 包，也打包进最终结果中
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

import buble from "rollup-plugin-buble";
import { terser } from "rollup-plugin-terser"; // 生成最小化的包
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

const extensions = [".js"];

const initRollup = ({
  pkg,
  name,
  input = "./src/index.js",
  context = "window",
}) => {
  const { version, types, author } = pkg || {};

  const banner = `/*!
  * ${name} v${version}
  * (c) ${new Date().getFullYear()} ${author}
  * @license MIT
  */`;

  const baseOutput = {
    name,
    plugins: [terser()],
    sourcemap: true,
    footer: `
    if(typeof window !== 'undefined') {
      window.pgk_${name
        .replace(/@/g, "_")
        .replace(/-/g, "_")
        .replace(/\//g, "_")}_version = '${version}'
    }
    ${banner}`,
  };

  return [
    {
      input,
      // external: [
      //   ...Object.keys(pkg.dependencies || {}),
      //   ...Object.keys(pkg.peerDependencies || {})
      // ],
      plugins: [
        resolve({ extensions }),
        commonjs({
          include: "node_modules/**",
        }),
        babel({
          extensions,
          include: ["./src/**/*"],
          runtimeHelpers: true,
          exclude: "node_modules/**",
        }),
      ],
      output: [
        {
          ...baseOutput,
          file: "dist/index.esm.js", // package.json 中 "module": "dist/index.esm.js"
          format: "esm", // es module 形式的包， 用来import 导入， 可以tree shaking
        },
        {
          ...baseOutput,
          plugins: [buble()],
          sourcemap: false,
          file: "dist/index.esm.browser.js",
          format: "esm", // umd 兼容形式的包， 可以直接应用于网页 script
        },
        {
          ...baseOutput,

          plugins: [buble(), terser()],
          file: "dist/index.esm.browser.min.js",
          format: "esm", // umd 兼容形式的包， 可以直接应用于网页 script
        },
        {
          ...baseOutput,
          file: "dist/index.common.js", // package.json 中 "main": "dist/index.cjs.js",
          format: "cjs", // commonjs 形式的包， require 导入
        },
        {
          ...baseOutput,
          file: "dist/index.js",
          plugins: [],
          sourcemap: false,
          format: "umd", // umd 兼容形式的包， 可以直接应用于网页 script
        },
        {
          ...baseOutput,
          file: "dist/index.min.js",
          format: "umd", // umd 兼容形式的包， 可以直接应用于网页 script
        },
      ],
      watch: {
        chokidar: {
          usePolling: true,
        },
      },
      context,
    },
  ];
};

const { name } = pkg;
export default initRollup({
  name,
  pkg,
});
