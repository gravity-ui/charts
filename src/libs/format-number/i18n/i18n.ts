import {I18N} from '@gravity-ui/i18n';

type KeysetData = Parameters<InstanceType<typeof I18N>['registerKeysets']>[1];

const i18nInstance = new I18N();

i18nInstance.setLang('ru');

const makeInstance = (keysetName: string, keysetsData: Record<string, KeysetData>) => {
    Object.entries(keysetsData).forEach(([key, value]) => i18nInstance.registerKeysets(key, value));
    return i18nInstance.i18n.bind(i18nInstance, keysetName);
};

export {i18nInstance, makeInstance};
