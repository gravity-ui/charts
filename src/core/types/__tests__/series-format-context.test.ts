import type {
    AreaSeries,
    BarXSeries,
    BarYSeries,
    BaseSeries,
    PieFormatContext,
    PieSeries,
} from '../../types';

interface PointCustom {
    source: string;
}

function isBaseSeries<T extends BaseSeries>(_series?: T) {
    return true;
}

describe('series-specific format contexts', () => {
    test('preserve BaseSeries compatibility and point custom generic semantics', () => {
        const pie: PieSeries<PointCustom> = {
            type: 'pie',
            custom: {owner: 'series'},
            data: [{name: 'A', value: 1, custom: {source: 'point'}}],
            dataLabels: {
                format: {
                    type: 'custom',
                    formatter: ({percentage}: PieFormatContext<PointCustom>) => String(percentage),
                },
            },
        };
        const base: BaseSeries = pie;

        expect(base).toBe(pie);
        expect([
            isBaseSeries<PieSeries<PointCustom>>(),
            isBaseSeries<AreaSeries<PointCustom>>(),
            isBaseSeries<BarXSeries<PointCustom>>(),
            isBaseSeries<BarYSeries<PointCustom>>(),
        ]).toEqual([true, true, true, true]);
    });
});
