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
    BaseSeriesData,
    CustomFormatContext,
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

interface PointFormatContext extends CustomFormatContext {
    data?: BaseSeriesData<PointCustom>;
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
        const base: BaseSeries = pie;

        expect(base).toBe(pie);
    });

    test('accept legacy BaseSeries formatting in specialized series', () => {
        const format: ValueFormat = {type: 'custom', formatter: ({value}) => String(value)};
        const base: BaseSeries = {
            visible: true,
            dataLabels: {format},
            tooltip: {valueFormat: format},
        };
        const pie: PieSeries = {...base, type: 'pie', data: []};
        const area: AreaSeries = {...base, type: 'area', name: 'A', data: []};
        const barX: BarXSeries = {...base, type: 'bar-x', name: 'A', data: []};
        const barY: BarYSeries = {...base, type: 'bar-y', name: 'A', data: []};
        for (const series of [pie, area, barX, barY]) {
            const common: BaseSeries = series;
            expect(common.visible).toBe(true);
            expect(series.dataLabels?.format).toBe(format);
            expect(series.tooltip?.valueFormat).toBe(format);
        }
        expect(getFormattedValue({value: 1, format})).toBe('1');
    });

    test('reuse optional series contexts in value-only helpers and line labels', () => {
        const pieFormat: PieValueFormat = {
            type: 'custom',
            formatter: ({percentage, name, value}) =>
                percentage?.toFixed(2) ?? name ?? String(value),
        };
        const areaFormat: AreaValueFormat = {
            type: 'custom',
            formatter: ({data, value}) => String(data?.y ?? value),
        };
        const barXFormat: BarXValueFormat = areaFormat;
        const barYFormat: BarYValueFormat = {
            type: 'custom',
            formatter: ({data, value}) => String(data?.x ?? value),
        };
        for (const format of [pieFormat, areaFormat, barXFormat, barYFormat]) {
            const shared: ValueFormat = format;
            const line: LineSeries = {type: 'line', name: 'L', data: [], dataLabels: {format}};
            expect(getFormattedValue({value: 1, format: shared})).toBe('1');
            expect(getFormattedValue({value: 1, format: line.dataLabels?.format})).toBe('1');
        }
        expect(getFormattedValue<PieFormatContext>({value: 1, format: pieFormat})).toBe('1');
        expect(
            getFormattedValue({
                value: 1,
                format: pieFormat,
                context: {percentage: 0.25},
            }),
        ).toBe('0.25');
    });

    test('allow existing BaseSeries helpers with and without custom formatters', () => {
        function applyDefaults<T extends BaseSeries>(series: T): T {
            series.visible ??= true;
            return series;
        }
        const pie: PieSeries<PointCustom> = {type: 'pie', data: []};
        const area: AreaSeries<PointCustom> = {type: 'area', name: 'A', data: []};
        const barX: BarXSeries<PointCustom> = {type: 'bar-x', name: 'A', data: []};
        const barY: BarYSeries<PointCustom> = {type: 'bar-y', name: 'A', data: []};
        for (const series of [pie, area, barX, barY]) {
            const base: BaseSeries = applyDefaults(series);
            expect(base.visible).toBe(true);
            const format: ValueFormat<PointFormatContext> = {
                type: 'custom',
                formatter: ({data, value}) => data?.custom?.source ?? String(value),
            };
            series.dataLabels = {format};
            expect(
                getFormattedValue({value: 1, format: applyDefaults(series).dataLabels?.format}),
            ).toBe('1');
        }
    });

    test('still require context for explicitly strict custom formatters', () => {
        interface RequiredPieContext extends PieFormatContext {
            percentage: number;
        }
        const format: ValueFormat<RequiredPieContext> = {
            type: 'custom',
            formatter: ({percentage}) => percentage.toFixed(2),
        };
        // Compile-time errors also demonstrate why this callback cannot receive value alone.
        const invalidCalls = () => {
            // @ts-expect-error Required percentage cannot be widened to a value-only formatter.
            const shared: ValueFormat = format;
            // @ts-expect-error The series contract allows percentage to be absent.
            const pieFormat: PieValueFormat = format;
            // @ts-expect-error Required formatter context is missing.
            getFormattedValue({value: 1, format});
            // @ts-expect-error Explicit generic arguments must also preserve required context.
            getFormattedValue<RequiredPieContext>({value: 1, format});
            // @ts-expect-error An empty context does not provide the required percentage.
            getFormattedValue({value: 1, format, context: {}});
            return {shared, pieFormat};
        };
        expect(invalidCalls).toThrow(TypeError);
        expect(getFormattedValue({value: 1, format, context: {percentage: 0.25}})).toBe('0.25');
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
