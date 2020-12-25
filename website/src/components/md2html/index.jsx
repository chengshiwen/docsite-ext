import { scroller } from 'react-scroll';
import path from 'path';
import 'whatwg-fetch'; // fetch polyfill
import './index.scss';

const anchorReg = /^#[^/]/;
// 相对地址正则，包括./、../、直接文件夹名称开头、直接文件开头
const relativeReg = /^((\.{1,2}\/)|([\w-]+[/.]))/;

const Md2Html = ComposeComponent => class extends ComposeComponent {

  constructor(props) {
    super(props);
    this.state = {
      __html: '',
    };
  }

  componentDidMount() {
    // 通过请求获取生成好的json数据，静态页和json文件在同一个目录下
    fetch(window.location.pathname.replace(/\.html$/i, '.json'))
    .then(res => res.json())
    .then((md) => {
      this.setState({
        __html: md && md.__html ? md.__html : '',
      });
    });
    this.markdownContainer.addEventListener('click', (e) => {
      const isAnchor = e.target.nodeName.toLowerCase() === 'a' && e.target.getAttribute('href') && anchorReg.test(e.target.getAttribute('href'));
      if (isAnchor) {
        e.preventDefault();
        const id = e.target.getAttribute('href').slice(1);
        scroller.scrollTo(id, {
          duration: 1000,
          smooth: 'easeInOutQuint',
        });
      }
    });
  }

  componentDidUpdate() {
    this.handleRelativeLink();
    this.handleRelativeImg();
  }

  handleRelativeLink() {
    const language = this.getLanguage();
    // 获取当前文档所在文件系统中的路径
    // rootPath/en-us/docs/dir/hello.html => /docs/en-us/dir
    const splitPart = window.location.pathname.replace(`${window.rootPath}/${language}`, '').split('/').slice(0, -1);
    const filePath = splitPart.join('/');
    const alinks = Array.from(this.markdownContainer.querySelectorAll('a'));
    alinks.forEach((alink) => {
      const href = alink.getAttribute('href');
      if (relativeReg.test(href)) {
        // 文档之间有中英文之分，md的相对地址要转换为对应HTML的地址
        alink.href = `${path.join(`${window.rootPath}/${language}`, filePath, href.replace(/\.(md|markdown)$/, '.html'))}`;
      }
    });
  }

  handleRelativeImg() {
    const language = this.getLanguage();
    // 获取当前文档所在文件系统中的路径
    // rootPath/en-us/docs/dir/hello.html => /docs/en-us/dir
    const splitPart = window.location.pathname.replace(`${window.rootPath}/${language}`, '').split('/').slice(0, -1);
    splitPart.splice(2, 0, language);
    const filePath = splitPart.join('/');
    const imgs = Array.from(this.markdownContainer.querySelectorAll('img'));
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      if (relativeReg.test(src)) {
        // 图片无中英文之分
        img.src = `${path.join(window.rootPath, filePath, src)}`;
      }
    });
  }

}

export default Md2Html;
