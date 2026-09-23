import type {ChartData, ChartLegend} from '../../../types';
import {getChartDimensions} from '../../layout/chart-dimensions';
import {getLegendComponents, getPreparedLegend} from '../prepare-legend';
import {getPreparedSeries} from '../prepareSeries';

jest.mock('../../utils', () => ({
    ...jest.requireActual('../../utils'),
    getTextSizeFn: () => async (text: string) => ({
        width: text.length * 10,
        height: 14,
        hangingOffset: 2,
    }),
    getLabelsSize: async ({labels}: {labels: string[]}) => ({
        maxWidth: Math.max(...labels.map((label) => label.length * 10)),
        maxHeight: 14,
    }),
}));

const chartWidth = 1000;
const chartMargin = {left: 10, right: 30, top: 10, bottom: 10};

async function prepareLegend(
    legend: ChartLegend,
    width = chartWidth,
    height = 400,
    seriesData: ChartData['series']['data'] = [
        {
            type: 'pie',
            data: [
                {name: 'A'.repeat(20), value: 1},
                {name: 'B'.repeat(20), value: 1},
                {name: 'C'.repeat(100), value: 1},
            ],
        },
    ],
) {
    const preparedLegend = await getPreparedLegend({
        legend,
        series: seriesData,
        chartWidth: width,
        chartMargin,
    });
    const resolvedWidthBeforeLayout = preparedLegend.resolvedWidth;
    const series = await getPreparedSeries({
        seriesData,
        seriesOptions: undefined,
        colors: ['red'],
        preparedLegend,
    });
    const components = await getLegendComponents({
        chartWidth: width,
        chartHeight: height,
        chartMargin,
        series,
        preparedLegend,
    });
    expect(preparedLegend.resolvedWidth).toBe(resolvedWidthBeforeLayout);

    return {preparedLegend, series, ...components};
}

describe.each(['left', 'right', 'top', 'bottom'] as const)(
    'discrete legend width, position=%s',
    (position) => {
        test.each([false, true])(
            'uses the width for layout and truncation (html=%s)',
            async (html) => {
                for (const width of [230, 600]) {
                    const legend = Object.freeze({enabled: true, position, width, html});
                    const {legendConfig, legendItems, preparedLegend, series} =
                        await prepareLegend(legend);

                    expect(legendConfig.width).toBe(width);
                    expect(legendConfig.maxWidth).toBe(width);
                    expect(preparedLegend.resolvedWidth).toBe(width);
                    expect(legendItems.map((line) => line.length)).toEqual(
                        width === 230 ? [1, 1, 1] : [2, 1],
                    );
                    for (const line of legendItems) {
                        const lineWidth = line.reduce(
                            (sum, item) =>
                                sum + item.textWidth + item.symbol.bboxWidth + item.symbol.padding,
                            (line.length - 1) * preparedLegend.itemDistance,
                        );
                        expect(lineWidth).toBeLessThanOrEqual(width);
                    }
                    const longItem = legendItems.flat()[2];
                    expect(longItem.overflowed).toBe(true);
                    expect(longItem.name).toBe('C'.repeat(100));
                    if (html) {
                        expect(longItem.text).toBe(longItem.name);
                        expect(longItem.textWidth).toBe(
                            width - longItem.symbol.bboxWidth - longItem.symbol.padding,
                        );
                    } else {
                        expect(longItem.text.endsWith('…')).toBe(true);
                        expect(longItem.text.length).toBeLessThan(longItem.name.length);
                    }

                    const isVertical = position === 'left' || position === 'right';
                    const dimensions = getChartDimensions({
                        height: 400,
                        width: chartWidth,
                        margin: chartMargin,
                        preparedLegend,
                        preparedSeries: series,
                        preparedXAxis: null,
                        preparedYAxis: null,
                        legendConfig,
                    });
                    expect(dimensions.boundsWidth).toBe(
                        chartWidth -
                            chartMargin.left -
                            chartMargin.right -
                            (isVertical ? width + preparedLegend.margin : 0),
                    );
                    if (isVertical) {
                        expect(legendConfig.offset.left).toBe(
                            position === 'left'
                                ? chartMargin.left
                                : chartWidth - chartMargin.right - width,
                        );
                    }
                    expect(legend.width).toBe(width);
                }
            },
        );

        test('preserves automatic sizing when width is omitted', async () => {
            const {legendConfig, preparedLegend} = await prepareLegend({enabled: true, position});
            const availableWidth = chartWidth - chartMargin.left - chartMargin.right;
            const expectedWidth =
                position === 'left' || position === 'right'
                    ? (availableWidth - 15) / 2
                    : availableWidth;
            expect(legendConfig.width).toBe(expectedWidth);
            expect(legendConfig.maxWidth).toBe(expectedWidth);
            expect(preparedLegend.resolvedWidth).toBe(expectedWidth);
        });

        test.each<ChartLegend['width']>([2000, '100%', '150%'])(
            'caps an explicit width to the available chart width (%s)',
            async (width) => {
                const {legendConfig, legendItems, preparedLegend, series} = await prepareLegend({
                    enabled: true,
                    position,
                    width,
                });
                const availableWidth = chartWidth - chartMargin.left - chartMargin.right;
                expect(preparedLegend.resolvedWidth).toBe(availableWidth);
                expect(legendConfig.width).toBe(availableWidth);
                expect(legendConfig.maxWidth).toBe(availableWidth);
                expect(legendConfig.offset.left).toBeGreaterThanOrEqual(chartMargin.left);
                const longItem = legendItems.flat()[2];
                expect(
                    longItem.textWidth + longItem.symbol.bboxWidth + longItem.symbol.padding,
                ).toBeLessThanOrEqual(availableWidth);

                const {boundsWidth} = getChartDimensions({
                    height: 400,
                    width: chartWidth,
                    margin: chartMargin,
                    preparedLegend,
                    preparedSeries: series,
                    preparedXAxis: null,
                    preparedYAxis: null,
                    legendConfig,
                });
                expect(boundsWidth).toBe(
                    position === 'left' || position === 'right' ? 0 : availableWidth,
                );
            },
        );

        test.each([
            {width: 0, containerWidth: 1000},
            {width: 600, containerWidth: 20},
            {width: undefined, containerWidth: 20},
        ])('keeps empty legend geometry nonnegative (%j)', async ({width, containerWidth}) => {
            const {legendConfig, legendItems, preparedLegend} = await prepareLegend(
                {enabled: true, position, width},
                containerWidth,
            );
            expect(preparedLegend.resolvedWidth).toBe(0);
            expect(legendConfig.width).toBe(0);
            expect(legendConfig.maxWidth).toBe(0);
            expect(legendConfig.height).toBe(0);
            expect(legendItems).toEqual([]);
        });
    },
);

test.each(['left', 'center', 'right'] as const)(
    'aligns the fixed-width horizontal legend to the %s',
    async (align) => {
        const {legendConfig} = await prepareLegend({enabled: true, width: 230, align});
        const remainingWidth = chartWidth - chartMargin.left - chartMargin.right - 230;
        const alignmentOffset = {left: 0, center: remainingWidth / 2, right: remainingWidth};
        expect(legendConfig.offset.left).toBe(chartMargin.left + alignmentOffset[align]);
    },
);

test('does not produce negative HTML label widths when the legend is narrower than its symbol', async () => {
    const {legendItems} = await prepareLegend({enabled: true, width: 10, html: true});
    expect(legendItems.flat().map((item) => item.textWidth)).toEqual([0, 0, 0]);
});

test('keeps automatic side legend width nonnegative when its margin exceeds the available width', async () => {
    const {legendConfig, legendItems} = await prepareLegend({enabled: true, position: 'left'}, 50);
    expect(legendConfig.width).toBe(0);
    expect(legendItems).toEqual([]);
});

test.each([undefined, 0, 230, 2000])(
    'preserves the continuous gradient width and its available alignment space (width=%s)',
    async (width) => {
        for (const position of ['left', 'right', 'top', 'bottom'] as const) {
            const {legendConfig, preparedLegend} = await prepareLegend({
                enabled: true,
                type: 'continuous',
                position,
                width,
            });
            const availableWidth = chartWidth - chartMargin.left - chartMargin.right;
            const isVertical = position === 'left' || position === 'right';
            expect(legendConfig.width).toBe(width ?? 200);
            expect(legendConfig.maxWidth).toBe(isVertical ? (width ?? 200) : availableWidth);
            expect(legendConfig.offset.left).toBe(
                position === 'right'
                    ? chartWidth - chartMargin.right - (width ?? 200)
                    : chartMargin.left,
            );
            expect(preparedLegend.resolvedWidth).toBe(width ?? 200);
        }
    },
);

describe('vertical legend layout', () => {
    test.each(['triangle', 'triangle-down', 'diamond'] as const)(
        'fits six %s markers without pagination at height 200',
        async (symbolType) => {
            const {legendConfig, preparedLegend} = await prepareLegend(
                {enabled: true, layout: 'vertical', position: 'left'},
                1000,
                200,
                Array.from({length: 6}, (_, i) => ({
                    type: 'scatter',
                    name: `Item ${i}`,
                    symbolType,
                    legend: {symbol: {width: 20}},
                    data: [{x: i, y: i}],
                })),
            );
            expect(preparedLegend.rows).toHaveLength(6);
            expect(preparedLegend.height).toBeLessThanOrEqual(180);
            expect(legendConfig.pagination).toBeUndefined();
        },
    );

    test.each([false, true])('includes large symbols in row heights (html=%s)', async (html) => {
        const {preparedLegend, legendItems} = await prepareLegend(
            {enabled: true, layout: 'vertical', html},
            1000,
            400,
            [
                {
                    type: 'pie',
                    legend: {symbol: {width: 20}},
                    data: [
                        {name: 'Large', value: 1},
                        {name: 'Small', value: 1, legend: {symbol: {width: 8}}},
                        {name: 'Larger', value: 1, legend: {symbol: {width: 30}}},
                    ],
                },
            ],
        );
        const heights = [40 / Math.sqrt(Math.PI), 14, 60 / Math.sqrt(Math.PI)];
        let top = 0;
        preparedLegend.rows.forEach((row, i) => {
            expect(row.height).toBeCloseTo(heights[i]);
            expect(row.top).toBeCloseTo(top);
            top += heights[i];
        });
        expect(preparedLegend.height).toBeCloseTo(top);
        // Text measurements remain separate for vertical alignment within taller rows.
        expect(legendItems.flat().map((item) => item.height)).toEqual([14, 14, 14]);
    });

    test.each([0, -10, 10, 100, 2000])(
        'paginates large symbols with legend width %s',
        async (width) => {
            const {preparedLegend, legendConfig} = await prepareLegend(
                {enabled: true, layout: 'vertical', position: 'left', width},
                1000,
                100,
                [
                    {
                        type: 'pie',
                        legend: {symbol: {width: 20}},
                        data: Array.from({length: 4}, (_, i) => ({name: `Item ${i}`, value: 1})),
                    },
                ],
            );
            if (width === 0) {
                expect(preparedLegend.rows).toEqual([]);
                expect(preparedLegend.height).toBe(0);
                expect(legendConfig.pagination).toBeUndefined();
                return;
            }
            expect(legendConfig.pagination?.pages).toEqual([
                {start: 0, end: 2},
                {start: 2, end: 4},
            ]);
            for (const page of legendConfig.pagination?.pages ?? []) {
                const height = preparedLegend.rows
                    .slice(page.start, page.end)
                    .reduce((sum, row) => sum + row.height, 0);
                expect(height + preparedLegend.lineHeight).toBeLessThanOrEqual(
                    preparedLegend.height,
                );
            }
            expect(preparedLegend.resolvedWidth).toBe(
                width < 0 ? (960 - 15) / 2 : Math.min(width, 960),
            );
            expect(preparedLegend.rows.every((row) => row.left >= 0)).toBe(true);
        },
    );

    test('includes line stroke width in row heights', async () => {
        const {preparedLegend} = await prepareLegend(
            {enabled: true, layout: 'vertical'},
            1000,
            400,
            [{type: 'line', name: 'Thick line', data: [], lineWidth: 24}],
        );
        expect(preparedLegend.rows[0].height).toBe(24);
        expect(preparedLegend.height).toBe(24);
    });

    test.each(['left', 'right', 'top', 'bottom'] as const)(
        'prepares one aligned item per row independently of width and output (%s)',
        async (position) => {
            for (const html of [false, true]) {
                for (const width of [230, 600, 2000]) {
                    const legend = Object.freeze({
                        enabled: true,
                        layout: 'vertical' as const,
                        position,
                        width,
                        html,
                    });
                    const {legendItems, preparedLegend} = await prepareLegend(legend);
                    expect(legendItems.map((line) => line.length)).toEqual([1, 1, 1]);
                    expect(legendItems.flat().map((item) => item.name)).toEqual([
                        'A'.repeat(20),
                        'B'.repeat(20),
                        'C'.repeat(100),
                    ]);
                    const rows = preparedLegend.rows;
                    expect(rows.map((row) => row.top)).toEqual([0, 14, 28]);
                    expect(rows.map((row) => row.height)).toEqual([14, 14, 14]);
                    expect(new Set(rows.map((row) => row.left)).size).toBe(1);
                    expect(new Set(rows.map((row) => row.items[0].textLeft)).size).toBe(1);
                    expect(preparedLegend.height).toBe(42);
                    expect(preparedLegend.resolvedWidth).toBe(Math.min(width, 960));
                    expect(legendItems.flat()[2].overflowed).toBe(true);
                    for (const row of rows) {
                        expect(row.left + row.width).toBeLessThanOrEqual(
                            preparedLegend.resolvedWidth,
                        );
                    }
                }
            }
        },
    );

    test.each(['left', 'center', 'right'] as const)(
        'aligns the entire list to the %s',
        async (align) => {
            const {preparedLegend} = await prepareLegend(
                {enabled: true, layout: 'vertical', width: 600, align},
                1000,
                400,
                [
                    {
                        type: 'line',
                        name: 'Short',
                        data: [],
                        legend: {symbol: {width: 30, padding: 8}},
                    },
                    {type: 'scatter', name: 'Longer label', data: [], legend: {symbol: {width: 8}}},
                ],
            );
            const rows = preparedLegend.rows;
            const listWidth = Math.max(...rows.map((row) => row.width));
            const left = {left: 0, center: (600 - listWidth) / 2, right: 600 - listWidth}[align];
            expect(rows.map((row) => row.left)).toEqual([left, left]);
            expect(rows.map((row) => row.items[0].textLeft)).toEqual([38, 38]);
            expect(rows[1].items[0].symbolLeft).toBeGreaterThan(rows[0].items[0].symbolLeft);
        },
    );

    test('retains group order and excludes disabled groups', async () => {
        const {legendItems} = await prepareLegend({enabled: true, layout: 'vertical'}, 1000, 400, [
            {type: 'line', name: 'First', data: [], legend: {groupId: '20'}},
            {type: 'line', name: 'Second', data: [], legend: {groupId: '1'}},
            {type: 'line', name: 'Same group', data: [], legend: {groupId: '20'}},
            {type: 'line', name: 'Disabled', data: [], legend: {enabled: false}},
        ]);
        expect(legendItems.map((line) => line.map((item) => item.id))).toEqual([['20'], ['1']]);
        expect(legendItems.flat().map((item) => item.name)).toEqual(['First', 'Second']);
    });

    test.each([0, -10, 10, 76])('paginates without empty pages at height %s', async (height) => {
        const {legendConfig, preparedLegend} = await prepareLegend(
            {enabled: true, layout: 'vertical'},
            1000,
            height,
        );
        expect(preparedLegend.height).toBeGreaterThanOrEqual(0);
        expect(legendConfig.pagination?.pages).toEqual([
            {start: 0, end: 1},
            {start: 1, end: 2},
            {start: 2, end: 3},
        ]);
        expect(preparedLegend.rows.every((row) => row.top >= 0 && row.height >= 0)).toBe(true);
    });

    test.each([0, 10])('handles width %s without negative coordinates', async (width) => {
        const {legendItems, preparedLegend} = await prepareLegend({
            enabled: true,
            layout: 'vertical',
            width,
            html: true,
        });
        expect(preparedLegend.resolvedWidth).toBe(Math.max(0, width));
        if (width <= 0) {
            expect(legendItems).toEqual([]);
            expect(preparedLegend.rows).toEqual([]);
        } else {
            expect(legendItems.flat().map((item) => item.textWidth)).toEqual([0, 0, 0]);
            expect(preparedLegend.rows.every((row) => row.left === 0)).toBe(true);
        }
    });

    test('defaults to the existing horizontal layout', async () => {
        const implicit = await prepareLegend({enabled: true, width: 600});
        const explicit = await prepareLegend({enabled: true, width: 600, layout: 'horizontal'});
        expect(implicit.preparedLegend.layout).toBe('horizontal');
        expect(implicit.preparedLegend.rows).toEqual(explicit.preparedLegend.rows);
        expect(implicit.legendItems.map((row) => row.length)).toEqual([2, 1]);
    });
});

test('continuous legend ignores vertical layout', async () => {
    const horizontal = await prepareLegend({enabled: true, type: 'continuous'});
    const vertical = await prepareLegend({enabled: true, type: 'continuous', layout: 'vertical'});
    expect(vertical.legendConfig).toEqual(horizontal.legendConfig);
    expect(vertical.preparedLegend.rows).toEqual([]);
});

describe.each([
    {type: 'discrete', layout: 'horizontal'},
    {type: 'discrete', layout: 'vertical'},
    {type: 'continuous', layout: 'horizontal'},
] as const)('$type legend width, layout=$layout', ({type, layout}) => {
    test.each([
        {width: '0px', pixels: 0, containerWidth: 1000},
        {width: '.5px', pixels: 0.5, containerWidth: 1000},
        {width: '25px', pixels: 25, containerWidth: 1000},
        {width: '230.5px', pixels: 230.5, containerWidth: 1000},
        {width: '2000px', pixels: 2000, containerWidth: 1000},
        {width: '230px', pixels: 230, containerWidth: 40},
        {width: '230px', pixels: 230, containerWidth: 20},
        {width: '230px', pixels: 230, containerWidth: 0},
    ] as const)(
        'treats pixel strings like numeric widths (%j)',
        async ({width, pixels, containerWidth}) => {
            const legend = Object.freeze({
                enabled: true,
                type,
                layout,
                position: 'left' as const,
                width,
                html: true,
            });
            const result = await prepareLegend(legend, containerWidth);
            const numericResult = await prepareLegend({...legend, width: pixels}, containerWidth);

            expect(result.preparedLegend.resolvedWidth).toBe(
                numericResult.preparedLegend.resolvedWidth,
            );
            expect(result.legendConfig).toEqual(numericResult.legendConfig);
            expect(result.legendItems.map((row) => row.map(({textWidth}) => textWidth))).toEqual(
                numericResult.legendItems.map((row) => row.map(({textWidth}) => textWidth)),
            );
            expect(legend.width).toBe(width);
        },
    );

    test.each([
        {width: '.5%', containerWidth: 1000, pixels: 4.8},
        {width: '12.5%', containerWidth: 1000, pixels: 120},
        {width: '0%', containerWidth: 1000, pixels: 0},
        {width: '100%', containerWidth: 1000, pixels: 960},
        {width: '150%', containerWidth: 1000, pixels: 960},
        {width: '25%', containerWidth: 50, pixels: 2.5},
        {width: '25%', containerWidth: 40, pixels: 0},
        {width: '25%', containerWidth: 20, pixels: 0},
        {width: '25%', containerWidth: 0, pixels: 0},
        {
            width: `${'9'.repeat(308)}%` as ChartLegend['width'],
            containerWidth: 1000,
            pixels: 960,
        },
    ] as const)(
        'resolves percentages to the equivalent pixel layout without changing config (%j)',
        async ({width, containerWidth, pixels}) => {
            for (const position of ['left', 'right', 'top', 'bottom'] as const) {
                const legend = Object.freeze({enabled: true, type, layout, position, width});
                const {preparedLegend, legendConfig} = await prepareLegend(legend, containerWidth);
                const numericResult = await prepareLegend(
                    {...legend, width: pixels},
                    containerWidth,
                );
                expect(preparedLegend.resolvedWidth).toBe(pixels);
                expect(legendConfig.width).toBe(pixels);
                expect(legendConfig).toEqual(numericResult.legendConfig);
                expect(legend.width).toBe(width);
            }
        },
    );

    test.each([-10, NaN, Infinity, -Infinity, '25.%', '25px\n', true, {}, null])(
        'falls back to automatic sizing for invalid input (%p)',
        async (width) => {
            for (const position of ['left', 'bottom'] as const) {
                const {legendConfig, preparedLegend} = await prepareLegend({
                    enabled: true,
                    type,
                    layout,
                    position,
                    width: width as ChartLegend['width'],
                });
                const availableWidth = chartWidth - chartMargin.left - chartMargin.right;
                const discreteWidth =
                    position === 'left' ? (availableWidth - 15) / 2 : availableWidth;
                const expectedWidth = type === 'continuous' ? 200 : discreteWidth;
                expect(preparedLegend.resolvedWidth).toBe(expectedWidth);
                expect(legendConfig.width).toBe(expectedWidth);
                expect(legendConfig.maxWidth).toBe(
                    type === 'continuous' && position === 'left' ? expectedWidth : discreteWidth,
                );
            }
        },
    );
});

describe.each(['left', 'right'] as const)('continuous side legend, position=%s', (position) => {
    test.each([
        {width: undefined, containerWidth: 800, pixels: 200},
        {width: '35%', containerWidth: 800, pixels: 266},
        {width: 0, containerWidth: 800, pixels: 0},
        {width: 2000, containerWidth: 800, pixels: 2000},
        {width: '150%', containerWidth: 800, pixels: 760},
        {width: '35%', containerWidth: 0, pixels: 0},
        {width: '35%', containerWidth: 20, pixels: 0},
    ])(
        'does not add alignment space around the gradient (%j)',
        async ({width, containerWidth, pixels}) => {
            const {legendConfig} = await prepareLegend(
                {enabled: true, type: 'continuous', position, width},
                containerWidth,
            );
            expect(legendConfig.width).toBe(pixels);
            expect(legendConfig.maxWidth).toBe(pixels);
            expect(legendConfig.offset.left).toBe(
                position === 'left'
                    ? chartMargin.left
                    : containerWidth - chartMargin.right - pixels,
            );
        },
    );
});
