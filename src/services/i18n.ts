import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import zh_CN from '@/locales/zh_CN.json';

const resources = {
	en: {
		translation: en,
	},
	'zh-CN': {
		translation: zh_CN,
	},
};

i18n.use(initReactI18next).init({
	resources,
	lng: 'en',
	interpolation: {
		escapeValue: false, // react already safes from xss
	},
});
