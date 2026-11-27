import {i18n, registerTranslations, setChartLanguage} from '../index';

describe('chart translations', () => {
    afterEach(() => {
        setChartLanguage('en');
    });

    test('uses registered legend text and the selected fallback for both pagination labels', () => {
        registerTranslations('es', {legend: {label_legend: 'Leyenda'}}, {fallbackLocale: 'ru'});
        setChartLanguage('es');

        expect(i18n('legend', 'label_legend')).toBe('Leyenda');
        expect(i18n('legend', 'label_previous-page')).toBe('Предыдущая страница легенды');
        expect(i18n('legend', 'label_next-page')).toBe('Следующая страница легенды');
    });

    test('merges multiple registrations for the same keyset', () => {
        registerTranslations('fr', {legend: {label_legend: 'Légende'}});
        registerTranslations('fr', {legend: {'label_next-page': 'Page suivante'}});
        setChartLanguage('fr');

        expect(i18n('legend', 'label_legend')).toBe('Légende');
        expect(i18n('legend', 'label_next-page')).toBe('Page suivante');
        expect(i18n('legend', 'label_previous-page')).toBe('Previous legend page');
    });

    test('switches between locales with independent fallbacks', () => {
        registerTranslations('de', {legend: {label_legend: 'Legende'}}, {fallbackLocale: 'ru'});
        registerTranslations('it', {legend: {label_legend: 'Legenda'}});
        setChartLanguage('de');
        expect(i18n('legend', 'label_next-page')).toBe('Следующая страница легенды');
        setChartLanguage('it');
        expect(i18n('legend', 'label_next-page')).toBe('Next legend page');
        setChartLanguage('ru');
        expect(i18n('legend', 'label_legend')).toBe('Легенда');
        setChartLanguage('en');
        expect(i18n('legend', 'label_legend')).toBe('Legend');
    });
});
