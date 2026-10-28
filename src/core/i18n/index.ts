import type {I18NFn, KeysetData} from '@gravity-ui/i18n';
import {I18N} from '@gravity-ui/i18n';

import en from './keysets/en.json';
import ru from './keysets/ru.json';

const i18nFactory = new I18N();

i18nFactory.registerKeysets('en', en);
i18nFactory.registerKeysets('ru', ru);
i18nFactory.setLang('en');
i18nFactory.setFallbackLang('en');

// The keyset type is inferred from the argument, so declaration files inline it instead of
// importing the JSON: an ES module cannot import JSON without an import attribute.
function bindI18n<T extends KeysetData>(_keysets: T) {
    return i18nFactory.i18n.bind(i18nFactory) as I18NFn<T>;
}

const i18n = bindI18n(en);

export {i18nFactory, i18n};
