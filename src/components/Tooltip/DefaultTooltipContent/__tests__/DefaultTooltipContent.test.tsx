/**
 * @jest-environment jsdom
 */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import {getSeriesPlugin, registerSeriesPlugin} from '~core/series/seriesRegistry';
import {getTooltipColorSymbol, getTooltipLineSymbol} from '~core/tooltip/utils';

import {areaPlugin} from '../../../../plugins/area';
import {areaRangePlugin} from '../../../../plugins/area-range';
import {barXPlugin} from '../../../../plugins/bar-x';
import {linePlugin} from '../../../../plugins/line';
import {waterfallPlugin} from '../../../../plugins/waterfall';
import type {
    ChartTooltip,
    ChartTooltipRowRendererArgs,
    ChartTooltipTotalsAggregationArgs,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipDataChunkLine,
    TooltipDataChunkRadar,
    TooltipDataChunkSankey,
} from '../../../../types';
import {DefaultTooltipContent} from '../index';

registerSeriesPlugin(areaPlugin);
registerSeriesPlugin(barXPlugin);
registerSeriesPlugin(linePlugin);
registerSeriesPlugin(areaRangePlugin);
registerSeriesPlugin(waterfallPlugin);

function makeLineChunk(
    name: string,
    y: number,
    tooltip?: {valueFormat?: {type: 'custom'; formatter: (args: {value: unknown}) => string}},
): TooltipDataChunkLine {
    return {
        data: {x: 1, y},
        series: {type: 'line', id: name, name, ...(tooltip ? {tooltip} : {})},
    };
}

function renderTooltip(ui: React.ReactElement) {
    return render(<ThemeProvider theme="light">{ui}</ThemeProvider>);
}

function expectNoHeader(container: HTMLElement) {
    // The tooltip header has no accessible role; assert its absence independently of row contents.
    // eslint-disable-next-line testing-library/no-node-access
    expect(container.querySelector('.gcharts-tooltip__series-name')).toBeNull();
}

describe('DefaultTooltipContent — header values', () => {
    const xAxis: ChartXAxis = {type: 'category', categories: ['A', 'B']};

    test.each([null, undefined, 5])('omits an unresolved header value (%s)', (x) => {
        const hovered: TooltipDataChunk[] = [
            {data: {x, y: 10}, series: {type: 'scatter', id: 'scatter', name: 'Scatter'}},
        ];
        const {container, rerender} = renderTooltip(
            <DefaultTooltipContent hovered={hovered} xAxis={xAxis} />,
        );
        expectNoHeader(container);

        rerender(
            <ThemeProvider theme="light">
                <DefaultTooltipContent
                    hovered={hovered}
                    xAxis={xAxis}
                    headerFormat={{type: 'date', format: 'YYYY-MM-DD'}}
                />
            </ThemeProvider>,
        );
        expectNoHeader(container);

        const formatter = jest.fn(() => 'Unexpected header');
        rerender(
            <ThemeProvider theme="light">
                <DefaultTooltipContent
                    hovered={hovered}
                    xAxis={xAxis}
                    headerFormat={{type: 'custom', formatter}}
                />
            </ThemeProvider>,
        );
        expect(formatter).not.toHaveBeenCalled();
        expectNoHeader(container);
    });

    test.each([
        {type: 'bar-y', y: undefined},
        {type: 'bar-y', y: 5},
        {type: 'x-range', y: undefined},
        {type: 'x-range', y: 5},
    ] as const)('omits an unresolved Y header for $type ($y)', ({type, y}) => {
        const hovered: TooltipDataChunk[] = [
            type === 'bar-y'
                ? {data: {x: 10, y}, series: {type, name: 'Series', data: []}}
                : {
                      data: {x0: 0, x1: 10, y},
                      series: {type, name: 'Series', data: []},
                  },
        ];
        const yAxis = {type: 'category' as const, categories: ['A', 'B']};
        const {container, rerender} = renderTooltip(
            <DefaultTooltipContent hovered={hovered} yAxis={yAxis} />,
        );
        expectNoHeader(container);

        const formatter = jest.fn(() => 'Unexpected header');
        rerender(
            <ThemeProvider theme="light">
                <DefaultTooltipContent
                    hovered={hovered}
                    yAxis={yAxis}
                    headerFormat={{type: 'custom', formatter}}
                />
            </ThemeProvider>,
        );
        expect(formatter).not.toHaveBeenCalled();
        expectNoHeader(container);
    });

    test.each(['bar-x', 'scatter'] as const)('uses a legacy category in a %s header', (type) => {
        const hovered: TooltipDataChunk[] = [
            type === 'bar-x'
                ? {data: {category: 'A', y: 10}, series: {type, name: 'Series', data: []}}
                : {data: {category: 'A', y: 10}, series: {type, name: 'Series', id: 'series'}},
        ];
        renderTooltip(<DefaultTooltipContent hovered={hovered} xAxis={xAxis} />);
        expect(screen.getByText('A')).toBeDefined();
    });

    test('formats a Cartesian header exactly once', () => {
        const hovered: TooltipDataChunk[] = [
            {data: {x: 1, y: 10}, series: {type: 'line', id: 'line', name: 'Line'}},
        ];
        const formatter = jest.fn(({value}) => `Category:${value}`);
        renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                xAxis={xAxis}
                headerFormat={{type: 'custom', formatter}}
            />,
        );
        expect(screen.getByText('Category:B')).toBeDefined();
        expect(formatter).toHaveBeenCalledTimes(1);
        expect(formatter).toHaveBeenCalledWith({value: 'B'});
    });

    test('preserves zero in the header', () => {
        const hovered: TooltipDataChunk[] = [
            {data: {x: 0, y: 10}, series: {type: 'line', id: 'line', name: 'Line'}},
        ];
        renderTooltip(<DefaultTooltipContent hovered={hovered} xAxis={{type: 'linear'}} />);
        expect(screen.getByText('0')).toBeDefined();
    });

    describe.each(['linear', 'datetime'] as const)('%s headers with missing values', (type) => {
        test.each([null, undefined])('allows a custom placeholder for %s', (x) => {
            const hovered: TooltipDataChunk[] = [
                {data: {x, y: 10}, series: {type: 'scatter', id: 'scatter', name: 'Scatter'}},
            ];
            const formatter = jest.fn(() => 'No coordinate');
            renderTooltip(
                <DefaultTooltipContent
                    hovered={hovered}
                    xAxis={{type}}
                    headerFormat={{type: 'custom', formatter}}
                />,
            );
            expect(screen.getByText('No coordinate')).toBeDefined();
            expect(formatter).toHaveBeenCalledTimes(1);
            expect(formatter).toHaveBeenCalledWith({value: x});
        });

        test.each([null, undefined])(
            'omits a missing value without a custom formatter (%s)',
            (x) => {
                const hovered: TooltipDataChunk[] = [
                    {data: {x, y: 10}, series: {type: 'scatter', id: 'scatter', name: 'Scatter'}},
                ];
                const {container} = renderTooltip(
                    <DefaultTooltipContent hovered={hovered} xAxis={{type}} />,
                );
                expectNoHeader(container);
            },
        );
    });

    const radarChunk: TooltipDataChunkRadar = {
        data: {value: 10},
        series: {type: 'radar', name: 'Radar', data: []},
        category: {key: 'Category A'},
        closest: true,
    };

    test('keeps radar headers hidden without headerFormat', () => {
        renderTooltip(<DefaultTooltipContent hovered={[radarChunk]} />);
        expect(screen.queryByText('Category A')).toBeNull();
        expect(screen.getByText('10')).toBeDefined();
    });

    test('formats a radar category exactly once', () => {
        const formatter = jest.fn(({value}) => `Category:${value}`);
        renderTooltip(
            <DefaultTooltipContent
                hovered={[radarChunk]}
                headerFormat={{type: 'custom', formatter}}
            />,
        );
        expect(screen.getByText('Category:Category A')).toBeDefined();
        expect(formatter).toHaveBeenCalledTimes(1);
        expect(formatter).toHaveBeenCalledWith({value: 'Category A'});
    });

    test('applies built-in date formatting to radar headers', () => {
        renderTooltip(
            <DefaultTooltipContent
                hovered={[{...radarChunk, category: {key: '2026-10-05'}}]}
                headerFormat={{type: 'date', format: 'DD.MM.YYYY'}}
            />,
        );
        expect(screen.getByText('05.10.2026')).toBeDefined();
    });

    test('allows a custom radar header placeholder for a missing category', () => {
        const formatter = jest.fn(() => 'No category');
        renderTooltip(
            <DefaultTooltipContent
                hovered={[{...radarChunk, category: undefined}]}
                headerFormat={{type: 'custom', formatter}}
            />,
        );
        expect(formatter).toHaveBeenCalledTimes(1);
        expect(formatter).toHaveBeenCalledWith({value: null});
        expect(screen.getByText('No category')).toBeDefined();
        expect(screen.getByText('10')).toBeDefined();
    });
});

describe('DefaultTooltipContent — plugin aggregate values', () => {
    afterEach(() => jest.restoreAllMocks());

    test('keeps raw row formatter and renderer values independent of plugin totals', () => {
        const hovered = [makeLineChunk('First', 10), makeLineChunk('Second', 20)];
        jest.spyOn(getSeriesPlugin('line').tooltip, 'getValue').mockReturnValue(100);
        const formatter = jest.fn(({value}) => `raw:${value}`);
        const rowRenderer = jest.fn(({id}: ChartTooltipRowRendererArgs) => <tr key={id} />);
        const totalFormatter = jest.fn(({value}) => `total:${value}`);

        renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                yAxis={{type: 'linear'}}
                rowRenderer={rowRenderer}
                valueFormat={{type: 'custom', formatter}}
                totals={{enabled: true, valueFormat: {type: 'custom', formatter: totalFormatter}}}
            />,
        );

        expect(formatter.mock.calls).toEqual([[{value: 10}], [{value: 20}]]);
        expect(rowRenderer.mock.calls.map(([args]) => args.value)).toEqual([10, 20]);
        expect(rowRenderer.mock.calls.map(([args]) => args.formattedValue)).toEqual([
            'raw:10',
            'raw:20',
        ]);
        expect(rowRenderer.mock.calls[0][0].hovered).toBe(hovered);
        expect(totalFormatter).toHaveBeenCalledWith({value: 200});
    });

    test('passes original chunks and axes to custom aggregation', () => {
        const hovered = [makeLineChunk('First', 10), makeLineChunk('Second', 20)];
        const xAxis: ChartXAxis = {type: 'linear'};
        const yAxis: ChartYAxis = {type: 'linear'};
        jest.spyOn(getSeriesPlugin('line').tooltip, 'getValue').mockReturnValue(100);
        const aggregation = jest.fn((_args: ChartTooltipTotalsAggregationArgs) => 30);

        renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                xAxis={xAxis}
                yAxis={yAxis}
                totals={{enabled: true, aggregation}}
            />,
        );

        expect(aggregation).toHaveBeenCalledWith({hovered, xAxis, yAxis, yAxes: [yAxis]});
        const [args] = aggregation.mock.calls[0];
        expect(args.hovered).toBe(hovered);
        expect(args.xAxis).toBe(xAxis);
        expect(args.yAxis).toBe(yAxis);
    });

    test.each([7, 0, undefined])('passes Sankey link value %s to the row renderer', (value) => {
        const chunk: TooltipDataChunkSankey = {
            series: {type: 'sankey', name: 'Flow', data: []},
            data: {
                name: 'Source',
                links: [
                    {name: 'Other', value: 100},
                    ...(value === undefined ? [] : [{name: 'Target', value}]),
                ],
            },
            target: {name: 'Target', links: []},
        };
        const rowRenderer = jest.fn(({id}: ChartTooltipRowRendererArgs) => <tr key={id} />);

        renderTooltip(<DefaultTooltipContent hovered={[chunk]} rowRenderer={rowRenderer} />);

        expect(rowRenderer).toHaveBeenCalledWith(expect.objectContaining({value}));
        expect(getSeriesPlugin('sankey').tooltip.getValue?.({item: chunk})).toBe(value);
    });
});

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

        expect(container.textContent).toContain('formatted:5 — formatted:10');
        expect(formatter).toHaveBeenCalledTimes(2);
        expect(formatter).toHaveBeenNthCalledWith(1, {value: 5});
        expect(formatter).toHaveBeenNthCalledWith(2, {value: 10});
    });
});

describe('DefaultTooltipContent — area-range values', () => {
    const hovered: TooltipDataChunk[] = [
        {
            data: {x: 1, y0: 5, y1: 10},
            series: {type: 'area-range', id: 'range', name: 'Range'},
        },
    ];

    test('passes width and independently formatted boundaries to rowRenderer', () => {
        const formatter = jest.fn(({value}) => `value:${value}`);
        const rowRenderer = jest.fn(({id}: ChartTooltipRowRendererArgs) => <tr key={id} />);
        renderTooltip(
            <DefaultTooltipContent
                hovered={hovered}
                rowRenderer={rowRenderer}
                valueFormat={{type: 'custom', formatter}}
                yAxis={{type: 'linear'}}
            />,
        );
        expect(rowRenderer).toHaveBeenCalledWith(
            expect.objectContaining({
                value: 5,
                formattedValue: 'value:5 — value:10',
            }),
        );
        expect(formatter).toHaveBeenCalledTimes(2);
        expect(formatter).toHaveBeenNthCalledWith(1, {value: 5});
        expect(formatter).toHaveBeenNthCalledWith(2, {value: 10});
    });

    test('rowRenderer retains row value formatting when user cells specify another format', () => {
        const cellFormatter = jest.fn(({value}) => `cell:${value}`);
        const renderer = jest.fn(({id}: ChartTooltipRowRendererArgs) => <tr key={id} />);
        renderTooltip(
            <DefaultTooltipContent
                hovered={[makeLineChunk('Line', 5)]}
                rows={[
                    {
                        renderer,
                        cells: [
                            {
                                id: 'value',
                                source: 'data.y',
                                format: {type: 'custom', formatter: cellFormatter},
                            },
                        ],
                    },
                ]}
                valueFormat={{type: 'custom', formatter: ({value}) => `row:${value}`}}
                yAxis={{type: 'linear'}}
            />,
        );
        expect(renderer).toHaveBeenCalledWith(
            expect.objectContaining({value: 5, formattedValue: 'row:5'}),
        );
        expect(cellFormatter).not.toHaveBeenCalled();
    });

    test('built-in totals sum widths', () => {
        const {container} = renderTooltip(
            <DefaultTooltipContent
                hovered={[
                    ...hovered,
                    {
                        data: {x: 1, y0: 3, y1: 6},
                        series: {type: 'area-range', id: 'second', name: 'Second'},
                    },
                ]}
                totals={{enabled: true, label: 'Total width'}}
                yAxis={{type: 'linear'}}
            />,
        );
        expect(container.textContent).toContain('5 — 10');
        expect(container.textContent).toContain('3 — 6');
        expect(container.textContent).toContain('Total width8');
    });
});

describe('DefaultTooltipContent — rowRenderer color argument', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    function collectRowRendererColors(hovered: TooltipDataChunk[]) {
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
    test.each([['area'], ['area-range'], ['line'], ['bar-x']])(
        '%s series passes a raw color to rowRenderer',
        (type) => {
            const hovered = makeChunk({
                data: {x: 1, y: 10, y0: 5, y1: 10},
                color: '#ff0000',
                series: {type, id: 's', name: 'S', color: '#ff0000'},
            });

            expect(collectRowRendererColors(hovered)).toEqual(['#ff0000']);
        },
    );

    test('falls back to the series color when neither the chunk nor the point carries one', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10},
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });

        expect(collectRowRendererColors(hovered)).toEqual(['#abcdef']);
    });

    test('falls back to the point color before the series color', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10, color: '#222222'},
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });

        expect(collectRowRendererColors(hovered)).toEqual(['#222222']);
    });

    test('the color resolved on the chunk wins over the point and the series', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10, color: '#222222'},
            color: '#111111',
            series: {type: 'area', id: 's', name: 'S', color: '#abcdef'},
        });

        expect(collectRowRendererColors(hovered)).toEqual(['#111111']);
    });

    // `waterfall` rows carry no color cell at all, so nothing resolves. The declared contract is
    // `color?: string`, which means absence has to reach the renderer as `undefined`, not `null`.
    test('passes undefined when the row has no color cell', () => {
        const hovered = makeChunk({
            data: {x: 1, y: 10, total: false},
            series: {type: 'waterfall', id: 's', name: 'S', color: '#abcdef'},
        });

        // waterfall renders a `default` and a `subtotal` row for a non-total point
        expect(collectRowRendererColors(hovered)).toStrictEqual([undefined, undefined]);
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
