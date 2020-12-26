'use strict';

const path = require('path');
const fs = require('fs-extra');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const chalk = require('chalk');
const ejs = require('ejs');
const yaml = require('js-yaml');

let siteConfig;
try {
  // 初始化时该文件还不存在
  siteConfig = require(path.join(process.cwd(), './site_config/site')).default;
} catch (err) {
  // do nothing
}
let docsiteConfig;
let dist = '';

try {
  const configPath = path.join(process.cwd(), 'docsite.config.yml');
  if (fs.existsSync(configPath)) {
    docsiteConfig = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.log(err);
}

const getConfigValue = (config, type, page, language, key) => {
  try {
    return config[type][page][language][key];
  } catch (err) {
    return '';
  }
};

const renderHTMLFile = (cwd, lang, Page, page, subPage = '') => {
  const targetPath = page === 'home' ? path.join(cwd, dist, lang) : path.join(cwd, dist, lang, page, subPage);
  fs.ensureDirSync(targetPath);
  ejs.renderFile(
    path.join(cwd, './template.ejs'),
    {
      title: getConfigValue(docsiteConfig, 'pages', page, lang, 'title') || subPage || page,
      keywords: getConfigValue(docsiteConfig, 'pages', page, lang, 'keywords') || subPage || page,
      description: getConfigValue(docsiteConfig, 'pages', page, lang, 'description') || subPage || page,
      rootPath: window.rootPath,
      page,
      __html: ReactDOMServer.renderToString(React.createElement(Page, { lang }, null)),
    },
    (err, str) => {
      if (err) {
        console.log(chalk.red(err));
        process.exit(1);
      }
      fs.writeFileSync(path.join(targetPath, 'index.html'), str, 'utf8');
    }
  );
};

const renderHTMLFileForLangs = (cwd, page, subPage = '') => {
  // 文件夹并且下面有index.jsx文件
  const targetPath = path.join(cwd, './src/pages', page, subPage);
  if (fs.existsSync(path.join(targetPath, 'index.jsx'))) {
    // 导入用ES6 export default导出的模块
    const Page = require(targetPath).default;
    // 生成英文版
    renderHTMLFile(cwd, 'en-us', Page, page, subPage);
    // 生成中文版
    renderHTMLFile(cwd, 'zh-cn', Page, page, subPage);
  }
};

const generateHTMLFile = (env, cwd) => {
  if (env === 'dev') {
    window.rootPath = '';
  } else if (env === 'prod') {
    window.rootPath = siteConfig.rootPath;
    dist = 'dist';
  }
  // 生成404.html、重定向页面（用于初始进入的语言跳转）
  if (fs.existsSync(path.join(cwd, './redirect.ejs'))) {
    ejs.renderFile(
      path.join(cwd, './redirect.ejs'),
      {
        defaultLanguage: siteConfig.defaultLanguage,
        rootPath: window.rootPath,
      },
      (err, str) => {
        if (err) {
          console.log(chalk.red(err));
          process.exit(1);
        }
        fs.writeFileSync(path.join(cwd, dist, '404.html'), str, 'utf8');
        fs.writeFileSync(path.join(cwd, dist, 'index.html'), str, 'utf8');
      }
    );
  }
  // 生成页面
  const pages = fs.readdirSync(path.join(cwd, './src/pages'));
  pages.forEach(page => {
    const pagePath = path.join(cwd, './src/pages', page);
    if (fs.statSync(pagePath).isDirectory()) {
      renderHTMLFileForLangs(cwd, page);
      const subPages = fs.readdirSync(pagePath);
      subPages.forEach(subPage => {
        renderHTMLFileForLangs(cwd, page, subPage);
      });
    }
  });
};
module.exports = generateHTMLFile;
