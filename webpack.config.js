/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Obfuscator = require('webpack-obfuscator'); // 混淆代码
const tsConfigFile = 'tsconfig.build.json';

const copyFiles = ['.env.production', 'package.json', 'pnpm-lock.yaml'];

/**
 * @type {import('webpack').Configuration}
 */

const webpackConfig = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, 'src', 'main.ts'), // 入口文件。改成你自己的,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-encrypt.js',
  },
  // 忽略依赖
  externals: [nodeExternals()],
  plugins: [
    new CleanWebpackPlugin(),
    new Obfuscator({
      // 混淆加密代码
      target: 'node', // 打包环境
      compact: true, // 压缩代码
      rotateStringArray: true, // 在混淆过程中对字符串数组进行随机索引偏移，以此打乱字符串在代码中的访问顺序，增加代码逆向分析的难度
      controlFlowFlattening: false, // 控制流扁平化，使得代码流程更难以理解和跟踪 经测试开启后会导致NestJS无法正常运行，因此关闭
      deadCodeInjection: true, // 是否注入无用代码以增强混淆
      deadCodeInjectionThreshold: 0.4, // 无用代码注入阈值
      debugProtection: true, // 启用调试保护 阻止浏览器或IDE中的JavaScript调试器访问代码
      debugProtectionInterval: 5000, // 启用调试保护间隔
      log: false, // 启用日志输出
      selfDefending: true, // 启用自我防御 防止被反混淆
      splitStrings: true, // 将长字符串拆分成多个短字符串
      transformObjectKeys: false, // 是否混淆对象键名
      renamePropertiesMode: 'safe', // 以更安全的方式重命名属性以防止运行时错误
    }),
    new CopyWebpackPlugin({
      // 拷贝文件到dist文件夹
      patterns: copyFileListByWebpack(copyFiles),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [
      // 别名路径处理
      new TsconfigPathsPlugin({
        configFile: tsConfigFile,
      }),
    ],
  },
};

// 创建一个Webpack编译器实例
const compiler = webpack(webpackConfig);

compiler.hooks.run.tap('MyPlugin', () => {
  console.log('Webpack编译器开始打包...');
});

compiler.hooks.make.tap('MyPlugin', () => {
  console.log('Webpack编译器开始编译...');
});

compiler.hooks.done.tap('MyPlugin', () => {
  console.log('Webpack编译器完成打包...');
});

// 启动Webpack编译器
compiler.run(async (err, stats) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Webpack编译器编译完成！');
});

// 在打包过程中，将环境配置文件复制到dist文件夹
function copyFileListByWebpack(fileList) {
  return fileList.map((item) => {
    return {
      from: path.resolve(__dirname, item),
      to: path.resolve(__dirname, 'dist', item),
    };
  });
}
