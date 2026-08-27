import type {PieFormatContext, PieSeriesData, PieValueFormat} from '../../../../types';
import {getPieDataLabelText, getPiePercentages} from '../label-format';

describe('pie label format', () => {
    test('calculates shares from the currently prepared segments', () => {
        const percentages = getPiePercentages([
            {id: 'visible-a', value: 10},
            {id: 'visible-b', value: 30},
        ]);

        expect(percentages.get('visible-a')).toBe(0.25);
        expect(percentages.get('visible-b')).toBe(0.75);
    });

    test('matches pie geometry for non-positive values', () => {
        const percentages = getPiePercentages([
            {id: 'positive', value: 10},
            {id: 'negative', value: -5},
            {id: 'empty', value: null},
        ]);

        expect(percentages.get('positive')).toBe(1);
        expect(percentages.get('negative')).toBe(0);
        expect(percentages.get('empty')).toBe(0);
    });

    test('keeps the label value and provides slice metadata to a custom formatter', () => {
        const data: PieSeriesData<{source: string}> = {
            name: 'Desktop',
            label: 'Custom label',
            value: 20,
            custom: {source: 'survey'},
        };
        const formatter = jest.fn(
            ({value, percentage, name, data: contextData}: PieFormatContext<{source: string}>) =>
                `${value} (${percentage}) ${name}:${contextData.custom?.source}`,
        );
        const format: PieValueFormat<{source: string}> = {type: 'custom', formatter};

        expect(getPieDataLabelText({data, format, percentage: 0.4})).toBe(
            'Custom label (0.4) Desktop:survey',
        );
        expect(formatter).toHaveBeenCalledWith({
            value: 'Custom label',
            percentage: 0.4,
            name: 'Desktop',
            data,
        });
    });
});
