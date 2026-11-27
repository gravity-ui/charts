import type {I18NFn, KeysetData} from '@gravity-ui/i18n';
import {I18N} from '@gravity-ui/i18n';

import en from './keysets/en.json';
import ru from './keysets/ru.json';

type Keysets = typeof en;
type TypedI18n = I18NFn<Keysets>;

const i18nFactory = new I18N();
const fallbackLocales = new Map<string, string>();

i18nFactory.registerKeysets('en', en);
i18nFactory.registerKeysets('ru', ru);
setChartLanguage('en');

const i18n = i18nFactory.i18n.bind(i18nFactory) as TypedI18n;

export {i18nFactory, i18n};

export interface ChartTranslationOptions {
    fallbackLocale?: string;
}

export function setChartLanguage(locale: string): void {
    i18nFactory.setLang(locale);
    i18nFactory.setFallbackLang(fallbackLocales.get(locale) ?? 'en');
}

export function registerTranslations(
    locale: string,
    translations: KeysetData,
    {fallbackLocale}: ChartTranslationOptions = {},
): void {
    const existing = i18nFactory.getLanguageData(locale);
    const merged = Object.fromEntries(
        Object.entries(translations).map(([keyset, messages]) => [
            keyset,
            {...existing?.[keyset], ...messages},
        ]),
    );

    i18nFactory.registerKeysets(locale, merged);

    if (fallbackLocale !== undefined) {
        fallbackLocales.set(locale, fallbackLocale);

        if (i18nFactory.lang === locale) {
            i18nFactory.setFallbackLang(fallbackLocale);
        }
    }
}
