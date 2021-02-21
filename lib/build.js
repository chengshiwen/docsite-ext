'use strict';

const shell = require('shelljs');
const path = require('path');
const generateJSONFile = require('./generateJSONFile.js');
const generateHTMLFile = require('./generateHTMLFile.js');

const CWD = process.cwd();

const build = () => {
  shell.cd(CWD);

  // 模拟浏览器环境
  const jsdom = require('jsdom');
  const { JSDOM } = jsdom;
  const dom = new JSDOM(
    '<!doctype html><html><body><head><link/><style></style><script></script></head><script></script></body></html>'
  );
  const { window } = dom;
  const copyProps = (src, target) => {
    const props = Object.getOwnPropertyNames(src)
      .filter(prop => typeof target[prop] === 'undefined')
      .map(prop => Object.getOwnPropertyDescriptor(src, prop));
    Object.defineProperties(target, props);
  };
  window.requestAnimationFrame = window.requestAnimationFrame || (f => window.setTimeout(f, 1e3 / 60));
  window.matchMedia =
    window.matchMedia ||
    function() {
      return {
        matches: false,
        addListener() {},
        removeListener() {},
      };
    };
  global.window = window;
  global.document = window.document;
  global.HTMLElement = window.HTMLElement;
  global.navigator = {
    userAgent: 'node.js',
  };
  copyProps(window, global);

  const gulp = `node ${path.join('node_modules', 'gulp', 'bin', 'gulp.js')}`;
  shell.exec(`${gulp} build`);
  generateJSONFile('prod', CWD);
  generateHTMLFile('prod', CWD);
  if (shell.exec(`${gulp} --tasks-simple`, { silent: true }).stdout.replace('\r', '').split('\n').includes('post-build')) {
    shell.exec(`${gulp} post-build`);
  }
};

module.exports = build;
