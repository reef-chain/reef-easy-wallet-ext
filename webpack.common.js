const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { ProvidePlugin } = require("webpack");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  entry: {
    popup: path.resolve("src/popup/index.tsx"),
    service_worker: path.resolve("src/background/service_worker.ts"),
    content: path.resolve("src/content/content.ts"),
    page: path.resolve("src/content/page.ts"),
  },
  module: {
    rules: [
      {
        use: "ts-loader",
        test: /\.tsx?$/,
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: "postcss-loader", // postcss loader needed for tailwindcss
            options: {
              postcssOptions: {
                ident: "postcss",
                plugins: [tailwindcss, autoprefixer],
              },
            },
          },
        ],
      },
      {
        type: "assets/resource",
        test: /\.(png|jpg|jpeg|gif|woff|woff2|tff|eot|svg)$/,
      },
      {
        test: /\.json$/,
        loader: "json-loader",
      },
      {
        test: /\.m?js/,
        type: "javascript/auto",
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve("src/static"),
          to: path.resolve("dist"),
        },
      ],
    }),
    new ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new HtmlPlugin({
      title: "Reef Easy Social Account Extension",
      filename: "index.html",
      chunks: ["popup"],
    }),
  ],
  resolve: {
    extensions: [".tsx", ".js", ".ts", ".cjs", ".mjs"],
    fallback: {
      crypto: false,
      stream: false,
      url: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      zlib: false,
    },
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "dist"),
  },
};
