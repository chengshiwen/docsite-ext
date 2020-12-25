'use strict';

const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const chalk = require('chalk');
const ejs = require('ejs');
const fs = require('fs-extra');
const parseMd = require('./parseMd.js');

let siteConfig;
try {
  // 初始化时该文件还不存在
  siteConfig = require(path.join(process.cwd(), './site_config/site')).default;
} catch (err) {
  // do noting
}

const generate = (env, cwd, type, lang, mdData) => {
  if (env === 'dev') {
    window.rootPath = '';
  } else if (env === 'prod') {
    window.rootPath = siteConfig.rootPath;
  }
  const parse = dir => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);
      const extension = path.extname(file);
      if (stat.isFile() && (extension === '.md' || extension === '.markdown')) {
        const result = parseMd(filepath);
        // cwd/docs/zh-cn/hello.md => cwd/zh-cn/docs/hello.json
        const fileInfo = path.parse(filepath);
        const splitArr = fileInfo.dir.split(`${type}${path.sep}${lang}`);
        const targetPath = `${splitArr[0]}${lang}${path.sep}${type}${splitArr[1]}`;
        fs.ensureDirSync(targetPath);
        fs.writeFileSync(
          path.join(targetPath, `${fileInfo.name}.json`),
          JSON.stringify(
            {
              filename: file,
              __html: result.__html,
              link: path.join(targetPath.replace(`${cwd}`, ''), `${fileInfo.name}.html`), // 对应实际的html链接，未加前缀
              meta: result.meta,
            },
            null,
            2
          ),
          'utf8'
        );
        mdData[lang].push({
          filename: file,
          link: path.join(targetPath.replace(`${cwd}`, ''), `${fileInfo.name}.html`), // 对应实际的html链接，未加前缀
          meta: result.meta,
        });
        const renderHTMLFile = (cwd, lang, page) => {
          if (!fs.existsSync(path.join(cwd, './src/pages', page, 'index.md.jsx'))) return;
          const Page = require(path.join(cwd, './src/pages', page, 'index.md.jsx')).default;
          ejs.renderFile(
            path.join(cwd, './template.ejs'),
            {
              title: result.meta.title || fileInfo.name,
              keywords: result.meta.keywords || fileInfo.name,
              description: result.meta.description || fileInfo.name,
              rootPath: window.rootPath,
              page: page + '.md',
              __html: ReactDOMServer.renderToString(
                React.createElement(Page, { lang, __html: result.__html, meta: result.meta }, null)
              ),
            },
            (err, str) => {
              if (err) {
                console.log(chalk.red(err));
                process.exit(1);
              }
              fs.writeFileSync(path.join(targetPath, `${fileInfo.name}.html`), str, 'utf8');
            }
          );
        };
        // 同步生成HTML
        renderHTMLFile(cwd, lang, type);
      } else if (stat.isDirectory()) {
        parse(filepath);
      }
    });
  };
  const dir = path.join(cwd, type, lang);
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    parse(dir);
  }
};

const generatePageJSONFile = (env, cwd, page) => {
  const pagePath = path.join(cwd, page);
  if (!(fs.existsSync(pagePath) && fs.statSync(pagePath).isDirectory())) return;
  const data = {
    'en-us': [],
    'zh-cn': [],
  };
  generate(env, cwd, page, 'en-us', data);
  generate(env, cwd, page, 'zh-cn', data);
  const mdDataPath = path.join(cwd, 'md_json');
  fs.ensureDirSync(mdDataPath);
  fs.writeFileSync(path.join(mdDataPath, page + '.json'), JSON.stringify(data, null, 2, 'utf8'));
};

const generateJSONFile = (env, cwd) => {
  generatePageJSONFile(env, cwd, 'docs');
  generatePageJSONFile(env, cwd, 'blog');
  generatePageJSONFile(env, cwd, 'community');
};

module.exports = generateJSONFile;
