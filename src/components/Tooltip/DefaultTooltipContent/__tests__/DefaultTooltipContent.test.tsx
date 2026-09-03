/**
 * @jest-environment jsdom
 */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import {registerSeriesPlugin} from '~core/series/seriesRegistry';
import {getTooltipColorSymbol, getTooltipLineSymbol} from '~core/tooltip/utils';

import {areaPlugin} from '../../../../plugins/area';
import {barXPlugin} from '../../../../plugins/bar-x';
import {linePlugin} from '../../../../plugins/line';
import type {ChartTooltip, ChartTooltipRowRendererArgs, TooltipDataChunk} from '../../../../types';
import {DefaultTooltipContent} from '../index';

registerSeriesPlugin(areaPlugin);
registerSeriesPlugin(barXPlugin);
registerSeriesPlugin(linePlugin);

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
});

describe('DefaultTooltipContent — rowRenderer color argument', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    function renderWithRowRenderer(hovered: TooltipDataChunk[]) {
        // Collected through a mock rather than a closure variable, so a re-render cannot
        // silently duplicate the recorded values.
        const rowRenderer = jest.fn<
            ReturnType<NonNullable<ChartTooltip['rowRenderer']>>,
            [ChartTooltipRowRendererArgs]
        >(({id}) => <tr key={id} />);

        renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                rowRenderer={rowRenderer}
                yAxis={{type: 'linear'}}
            />,
        );

        return rowRenderer.mock.calls.map(([args]) => args.color);
    }

    function makeChunk(props: Record<string, unknown>) {
        return [props] as unknown as TooltipDataChunk[];
    }

    // `bar-x` is the control: its color cell is not built from a function `source`, so it stays
    // green either way. Only `area` and `line` regress.
    test.each([['area'], ['line'], ['bar-x']])(
        '%s series passes a raw color to rowRenderer',
        (type) => {
            const hovered = makeChunk({
                data: {x: 1, y: 10},
                color: '#ff0000',
                series: {type, id: 's', name: 'S', color: '#ff0000'},
            });

            expect(renderWithRowRenderer(hovered)).toEqual(['#ff0000']);
        },
    );

    test('falls back to the series color when neither the chunk nor the point carries one', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10},
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });

        expect(renderWithRowRenderer(hovered)).toEqual(['#abcdef']);
    });

    test('falls back to the point color before the series color', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10, color: '#222222'},
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });

        expect(renderWithRowRenderer(hovered)).toEqual(['#222222']);
    });

    test('the color resolved on the chunk wins over the point and the series', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10, color: '#222222'},
            color: '#111111',
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });

        expect(renderWithRowRenderer(hovered)).toEqual(['#111111']);
    });

    test('a string cell source configured on the row still wins', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10, custom: {swatch: '#123456'}},
            color: '#111111',
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });
        const renderer = jest.fn<
            ReturnType<NonNullable<ChartTooltip['rowRenderer']>>,
            [ChartTooltipRowRendererArgs]
        >(({id}) => <tr key={id} />);

        renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                rows={[{cells: [{id: 'color', source: 'data.custom.swatch'}], renderer}]}
                yAxis={{type: 'linear'}}
            />,
        );

        expect(renderer.mock.calls.map(([args]) => args.color)).toEqual(['#123456']);
    });
});

describe('DefaultTooltipContent — default color cell rendering', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    function getColorCellHtml(chunk: Record<string, unknown>) {
        renderTooltip(
            <DefaultTooltipContent
                hovered={[chunk] as unknown as TooltipDataChunk[]}
                yAxis={{type: 'linear'}}
            />,
        );

        return screen.getAllByRole('cell')[0].innerHTML;
    }

    // Without a custom row the cell must still render the built-in swatch. For `line` the symbol
    // depends on the series stroke options, which reach the formatter through a closure — so this
    // guards the half of the wiring the rowRenderer tests do not touch.
    test('line renders the series line symbol with its stroke options', () => {
        const html = getColorCellHtml({
            data: {x: 1, y: 10},
            color: '#ff0000',
            series: {
                type: 'line',
                id: 's',
                name: 'S',
                color: '#ff0000',
                dashStyle: 'Dash',
                lineWidth: 3,
            },
        });

        expect(html).toContain(
            getTooltipLineSymbol({color: '#ff0000', dashStyle: 'Dash', lineWidth: 3}),
        );
    });

    test('area renders the built-in color swatch', () => {
        const html = getColorCellHtml({
            data: {x: 1, y: 10},
            color: '#ff0000',
            series: {type: 'area', id: 's', name: 'S', color: '#ff0000'},
        });

        expect(html).toContain(getTooltipColorSymbol({color: '#ff0000'}));
    });
});
