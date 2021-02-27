import React from 'react';
import ReactDOM from 'react-dom';
import Language from '../../components/language';
import Header from '../../components/header';
import Footer from '../../components/footer';
import Md2Html from '../../components/md2html';
import Bar from '../../components/bar';
import Sidemenu from '../../components/sidemenu';
import siteConfig from '../../../site_config/site';
import docsConfig from '../../../site_config/docs';

class Docs extends Md2Html(Language) {
  render() {
    const language = this.getLanguage();
    const dataSource = docsConfig[language];
    if (siteConfig.docsLatest) {
      dataSource.sidemenu.forEach((menu) => {
        menu.children.forEach((submenu) => {
          submenu.link = submenu.link.replace(`docs/${siteConfig.docsLatest}`, 'docs/latest');
        });
      });
    }
    const __html = this.props.__html || this.state.__html;
    return (
      <div className="md2html docs-page">
        <Header
          currentKey="docs"
          type="normal"
          logo="/img/dubbo_colorful.png"
          language={language}
          onLanguageChange={this.onLanguageChange}
        />
        <Bar img="/img/system/docs.png" text={dataSource.barText} />
        <section className="content-section">
          <Sidemenu dataSource={dataSource.sidemenu} />
          <div
            className="doc-content markdown-body"
            ref={(node) => { this.markdownContainer = node; }}
            dangerouslySetInnerHTML={{ __html }}
          />
        </section>
        <Footer logo="/img/dubbo_gray.png" language={language} />
      </div>
    );
  }
}

document.getElementById('root') && ReactDOM.render(<Docs />, document.getElementById('root'));

export default Docs;
