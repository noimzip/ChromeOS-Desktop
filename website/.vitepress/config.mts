import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Soul Widgets Manager",
  description: "A Windows-like desktop experience for ChromeOS",
  head: [['link', { rel: 'icon', href: '/soul-128.png' }]],
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/soul-128.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'GitHub', link: 'https://github.com/noimzip/Soul-Widgets-Manager' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Soul Widgets Manager?', link: '/guide/introduction' },
          { text: 'Features', link: '/guide/features' },
          { text: 'Architecture', link: '/guide/architecture' }
        ]
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Usage', link: '/guide/usage' },
          { text: 'Configuration', link: '/guide/configuration' }
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Developer Guide', link: '/guide/development' },
          { text: 'Contributing', link: '/guide/contributing' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/noimzip/Soul-Widgets-Manager' }
    ],

    footer: {
      message: 'Released under the GPL-3.0 License.',
      copyright: 'Copyright © 2026 Soul Widgets Manager Contributors'
    }
  },
  
  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    ja: {
      label: '日本語',
      lang: 'ja', // optional, will be added  as `lang` attribute on `html` tag
      link: '/ja/', // default /fr/ -- shows on navbar translations menu, can be external
      themeConfig: {
        nav: [
          { text: 'ホーム', link: '/ja/' },
          { text: 'ガイド', link: '/ja/guide/introduction' },
          { text: 'GitHub', link: 'https://github.com/noimzip/Soul-Widgets-Manager' }
        ],
        sidebar: [
          {
            text: 'はじめに',
            items: [
              { text: 'Soul Widgets Managerとは？', link: '/ja/guide/introduction' },
              { text: '機能', link: '/ja/guide/features' },
              { text: 'アーキテクチャ', link: '/ja/guide/architecture' }
            ]
          },
          {
            text: 'スタートガイド',
            items: [
              { text: 'インストール', link: '/ja/guide/installation' },
              { text: '使い方', link: '/ja/guide/usage' },
              { text: '設定', link: '/ja/guide/configuration' }
            ]
          },
          {
            text: '開発',
            items: [
              { text: '開発者ガイド', link: '/ja/guide/development' },
              { text: '貢献について', link: '/ja/guide/contributing' }
            ]
          }
        ],
        footer: {
          message: 'GPL-3.0 ライセンスの下でリリースされています。',
          copyright: 'Copyright © 2026 Soul Widgets Manager Contributors'
        }
      }
    }
  }
})