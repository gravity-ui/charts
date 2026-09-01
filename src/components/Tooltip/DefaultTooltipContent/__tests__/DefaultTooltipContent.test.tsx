/**
 * @jest-environment jsdom
 */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render} from '@testing-library/react';

import {registerSeriesPlugin} from '~core/series/seriesRegistry';

import {areaRangePlugin} from '../../../../plugins/area-range';
import {linePlugin} from '../../../../plugins/line';
import type {TooltipDataChunk} from '../../../../types';
import {DefaultTooltipContent} from '../index';

registerSeriesPlugin(linePlugin);
registerSeriesPlugin(areaRangePlugin);

function makeLineChunk(
    name: string,
    y: number,
    tooltip?: {valueFormat?: {type: 'custom'; formatter: (args: {value: unknown}) => string}},
): TooltipDataChunk {
    // `tooltip` is not declared on TooltipDataChunkLine.series, but at runtime
    // the hovered chunk carries a prepared series which includes it — mimic that.
    return {
        data: {x: 1, y},
        series: {type: 'line', id: name, name, ...(tooltip ? {tooltip} : {})} as never,
    };
}

function renderTooltip(ui: React.ReactElement) {
    return render(<ThemeProvider theme="light">{ui}</ThemeProvider>);
}

describe('DefaultTooltipContent — valueFormat precedence', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('series.tooltip.valueFormat takes precedence over chart tooltip.valueFormat', () => {
        const chartFormatter = jest.fn(({value}) => `chart:${value}`);
        const seriesFormatter = jest.fn(({value}) => `series:${value}`);

        const hovered: TooltipDataChunk[] = [
            makeLineChunk('Overridden', 10, {
                valueFormat: {type: 'custom', formatter: seriesFormatter},
            }),
            makeLineChunk('Inherited', 20),
        ];

        const {container} = renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                valueFormat={{type: 'custom', formatter: chartFormatter}}
                yAxis={{type: 'linear'}}
            />,
        );

        const text = container.textContent ?? '';

        expect(text).toContain('series:10');
        expect(text).toContain('chart:20');
        expect(text).not.toContain('chart:10');
        expect(text).not.toContain('series:20');

        expect(seriesFormatter).toHaveBeenCalledWith({value: 10});
        expect(chartFormatter).toHaveBeenCalledWith({value: 20});
    });

    test('area-range formats each boundary exactly once', () => {
        const formatter = jest.fn(({value}) => `formatted:${value}`);
        const hovered: TooltipDataChunk[] = [
            {
                data: {x: 1, y0: 5, y1: 10},
                series: {
                    type: 'area-range',
                    id: 'range',
                    name: 'Range',
                    tooltip: {valueFormat: {type: 'custom', formatter}},
                } as never,
            },
        ];
        const {container} = renderTooltip(
            <DefaultTooltipContent hovered={hovered} yAxis={{type: 'linear'}} />,
        );

        expect(container.textContent).toContain('formatted:5 – formatted:10');
        expect(formatter).toHaveBeenCalledTimes(2);
        expect(formatter).toHaveBeenNthCalledWith(1, {value: 5});
        expect(formatter).toHaveBeenNthCalledWith(2, {value: 10});
    });
});
