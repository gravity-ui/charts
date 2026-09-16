import type React from 'react';

import type {ChartTooltipContent} from '../../../index';
import {piePlugin} from '../../../plugins/pie';
import type {
    AreaSeries,
    AreaValueFormat,
    BarXSeries,
    BarXValueFormat,
    BarYSeries,
    BarYValueFormat,
    BaseSeries,
    LineSeries,
    PieFormatContext,
    PieSeries,
    PieValueFormat,
    TooltipDataChunkPie,
    ValueFormat,
} from '../../types';
import {getFormattedValue} from '../../utils/format';

interface PointCustom {
    source: string;
}

function isBaseSeries<T extends Omit<BaseSeries, 'dataLabels' | 'tooltip'>>(_series?: T) {
    return true;
}

describe('series-specific format contexts', () => {
    test('preserve common BaseSeries fields and point custom generic semantics', () => {
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
        const base: Omit<BaseSeries, 'dataLabels' | 'tooltip'> = pie;

        expect(base).toBe(pie);
        expect([
            isBaseSeries<PieSeries<PointCustom>>(),
            isBaseSeries<AreaSeries<PointCustom>>(),
            isBaseSeries<BarXSeries<PointCustom>>(),
            isBaseSeries<BarYSeries<PointCustom>>(),
        ]).toEqual([true, true, true, true]);
    });

    test('accept legacy BaseSeries formatting in specialized series', () => {
        const format: ValueFormat = {type: 'custom', formatter: ({value}) => String(value)};
        const base: BaseSeries = {dataLabels: {format}, tooltip: {valueFormat: format}};
        const pie: PieSeries = {...base, type: 'pie', data: []};
        const area: AreaSeries = {...base, type: 'area', name: 'A', data: []};
        const barX: BarXSeries = {...base, type: 'bar-x', name: 'A', data: []};
        const barY: BarYSeries = {...base, type: 'bar-y', name: 'A', data: []};
        for (const series of [pie, area, barX, barY]) {
            expect(series.dataLabels?.format).toBe(format);
            expect(series.tooltip?.valueFormat).toBe(format);
        }
        expect(getFormattedValue({value: 1, format})).toBe('1');
    });

    test('require specialized context without allowing formatter widening', () => {
        const pieFormat: PieValueFormat = {
            type: 'custom',
            formatter: ({percentage, name}) => percentage?.toFixed(2) ?? name,
        };
        const areaFormat: AreaValueFormat = {type: 'custom', formatter: ({data}) => String(data.y)};
        const barXFormat: BarXValueFormat = areaFormat;
        const barYFormat: BarYValueFormat = {type: 'custom', formatter: ({data}) => String(data.x)};
        // Type-only checks: these calls would be unsafe at runtime.
        const invalidCalls = () => {
            // @ts-expect-error Pie requires name and data.
            const shared: ValueFormat = pieFormat;
            const line: LineSeries = {type: 'line', name: 'L', data: []};
            // @ts-expect-error Line formatters only receive value.
            line.dataLabels = {format: pieFormat};
            // @ts-expect-error BaseSeries must not erase the required context either.
            const base: BaseSeries = {dataLabels: {format: pieFormat}};
            // @ts-expect-error Required pie context is missing.
            getFormattedValue({value: 1, format: pieFormat});
            // @ts-expect-error Partial pie context is insufficient.
            getFormattedValue({value: 1, format: pieFormat, context: {percentage: 0.25}});
            // @ts-expect-error Explicit generic arguments must also require context.
            getFormattedValue<PieFormatContext>({value: 1, format: pieFormat});
            // @ts-expect-error Area formatters require point data.
            getFormattedValue({value: 1, format: areaFormat});
            // @ts-expect-error Bar-x formatters require point data.
            getFormattedValue({value: 1, format: barXFormat});
            // @ts-expect-error Bar-y formatters require point data.
            getFormattedValue({value: 1, format: barYFormat});
            return {shared, line, base};
        };
        expect(invalidCalls).toBeDefined();
        expect(
            getFormattedValue({
                value: 1,
                format: pieFormat,
                context: {percentage: 0.25, name: 'A', data: {name: 'A', value: 1}},
            }),
        ).toBe('0.25');
        expect(
            getFormattedValue({
                value: 1,
                format: pieFormat,
                context: {name: 'A', data: {name: 'A', value: 1}},
            }),
        ).toBe('A');
    });

    test('accept legacy pie chunks for ChartTooltipContent', () => {
        const chunk: TooltipDataChunkPie = {
            data: {name: 'A', value: 1},
            series: {type: 'pie', id: 'pie', name: 'A'},
        };
        const hovered: React.ComponentProps<typeof ChartTooltipContent>['hovered'] = [chunk];
        expect(hovered).toEqual([chunk]);
        expect(piePlugin.tooltip.getValueFormatContext?.(chunk)).toEqual({
            percentage: undefined,
            name: 'A',
            data: chunk.data,
        });
    });
});
