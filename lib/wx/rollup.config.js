import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "./lib/wx/main.js",
  output: {
    name: "oss-wx.js",
    file:'dist/oss-wx.js',
    format: "umd",
    sourcemap: true,
  },
  plugins: [nodeResolve(), commonjs()],
};
