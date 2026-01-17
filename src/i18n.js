import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN.js';

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: 'zh-CN', // 设置默认语言
  fallbackLocale: 'zh-CN', // 如果当前语言缺少某个翻译，则回退到该语言
  messages: {
    'zh-CN': zhCN,
  },
});

export default i18n;
