(function(){
  // シンプルな i18n ランタイム
  const LS_KEY = 'language';
  const defaultLang = (localStorage.getItem(LS_KEY) || (navigator.language && navigator.language.startsWith('ja') ? 'ja' : 'en'));
  let translations = {};
  let lang = defaultLang;

  async function load(langCode){
    try{
      const res = await fetch(`./i18n/${langCode}.json`);
      if(!res.ok) throw new Error('Failed to load');
      translations = await res.json();
      lang = langCode;
      localStorage.setItem(LS_KEY, langCode);
      applyTranslations();
      document.dispatchEvent(new CustomEvent('i18n:loaded', { detail: { lang: langCode }}));
    }catch(e){
      console.error('i18n load error', e);
    }
  }

  function t(key){
    return translations[key] || key;
  }

  function applyTranslations(root=document){
    // data-i18n を持つ要素を検索
    const nodes = root.querySelectorAll('[data-i18n]');
    nodes.forEach(node => {
      const k = node.getAttribute('data-i18n');
      const txt = t(k);
      if(node.tagName === 'INPUT' || node.tagName === 'TEXTAREA'){
        if(node.placeholder !== undefined) node.placeholder = txt;
        else node.value = txt;
      } else if(node.tagName === 'OPTION'){
        node.textContent = txt;
      } else {
        // title 属性がある場合は title を更新する要素もある
        if(node.hasAttribute('data-i18n-title')){
          node.title = t(node.getAttribute('data-i18n-title'));
        }
        // そのまま textContent を置換
        node.textContent = txt;
      }
    });

    // data-i18n-title 単独指定（title 属性のみ翻訳したい要素）
    root.querySelectorAll('[data-i18n-title]').forEach(node => {
      node.title = t(node.getAttribute('data-i18n-title'));
    });
  }

  function setLanguage(code){
    if(code === lang) return;
    load(code);
  }

  // 初期ロード
  document.addEventListener('DOMContentLoaded', () => {
    load(lang);
    // 言語セレクタがあれば連動させる
    const selector = document.getElementById('language_selector');
    if (selector) {
      // 値を現在の言語に合わせる
      selector.value = localStorage.getItem(LS_KEY) || lang;
      selector.addEventListener('change', (e) => {
        const v = e.target.value;
        setLanguage(v);
      });

      // i18n 読み込み時にセレクタを同期
      document.addEventListener('i18n:loaded', (ev) => {
        if (selector) selector.value = ev.detail?.lang || lang;
      });
    }
  });

  // エクスポート
  window.i18n = { t, load, setLanguage, applyTranslations, get language(){ return lang; } };
})();
