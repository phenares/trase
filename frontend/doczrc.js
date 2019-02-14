// eslint-disable-next-line
import merge from 'webpack-merge';
import webpackConfig from './config/webpack.config';

export default {
  src: '../doc/trase',
  dest: './docs/dist',
  title: 'Trase',
  files: '**/*.{md,markdown,mdx}',
  menu: ['Home', { name: 'Components', menu: ['cards', 'button'] }],
  themeConfig: {
    colors: {
      primary: '#34444C',
      sidebarBg: '#fff0c2'
    }
  },
  modifyBundlerConfig: config =>
    merge(config, {
      resolve: webpackConfig.resolve,
      module: webpackConfig.module
    }),
  plugins: [],
  codeSandbox: false
};
