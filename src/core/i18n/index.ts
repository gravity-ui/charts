import type {I18NFn} from '@gravity-ui/i18n';
import {I18N} from '@gravity-ui/i18n';

import en from './keysets/en.json';
import ru from './keysets/ru.json';

type Keysets = typeof en;
type TypedI18n = I18NFn<Keysets>;

const i18nFactory = new I18N();

i18nFactory.registerKeysets('en', en);
i18nFactory.registerKeysets('ru', ru);
i18nFactory.setLang('en');
i18nFactory.setFallbackLang('en');

const i18n = i18nFactory.i18n.bind(i18nFactory) as TypedI18n;

export {i18nFactory, i18n};
