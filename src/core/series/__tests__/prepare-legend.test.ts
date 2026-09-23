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
    options: {names?: string[]; height?: number} = {},
) {
    const seriesData: ChartData['series']['data'] = [
        {
            type: 'pie',
            data: (options.names ?? ['A'.repeat(20), 'B'.repeat(20), 'C'.repeat(100)]).map(
                (name) => ({name, value: 1}),
            ),
        },
    ];
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
        chartHeight: options.height ?? 400,
        chartMargin,
        series,
        preparedLegend,
    });
    if (legend.width !== 'auto' && !preparedLegend.constrainContent) {
        expect(preparedLegend.resolvedWidth).toBe(resolvedWidthBeforeLayout);
    }

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

describe('content-based legend width', () => {
    test('includes the title and truncates it without changing the config', async () => {
        const legend: ChartLegend = {
            enabled: true,
            position: 'left',
            width: 'auto',
            title: {text: 'Legend title'},
        };
        const {legendConfig, preparedLegend} = await prepareLegend(legend, 1000, {names: ['A']});
        expect(legendConfig.width).toBe(120);
        expect(legendConfig.height).toBe(14 + 14 + 4);
        expect(preparedLegend.title.resolvedText).toBe('Legend title');
        const capped = await prepareLegend({...legend, maxWidth: 80}, 1000, {names: ['A']});
        expect(capped.legendConfig.width).toBe(80);
        expect(capped.preparedLegend.title.resolvedWidth).toBeLessThanOrEqual(80);
        expect(capped.preparedLegend.title.resolvedText.endsWith('…')).toBe(true);
        expect(legend.title?.text).toBe('Legend title');
    });

    test('includes the paginator when it is wider than any row', async () => {
        // Large item spacing forces one item per row without increasing the width of that row.
        const {legendConfig} = await prepareLegend(
            {enabled: true, position: 'left', width: 'auto', itemDistance: 1000},
            1000,
            {names: Array(20).fill('A'), height: 80},
        );
        expect(legendConfig.pagination?.pages.length).toBeGreaterThan(1);
        expect(legendConfig.width).toBe(50); // two arrows and the widest n/n counter
    });

    test('measures rows on every page', async () => {
        const {legendConfig, legendItems} = await prepareLegend(
            {enabled: true, position: 'left', width: 'auto', itemDistance: 1000},
            1000,
            {names: ['A', 'B', 'C', 'D', 'Longest label'], height: 80},
        );
        expect(legendConfig.pagination?.pages.length).toBeGreaterThan(1);
        const widest = legendItems[legendItems.length - 1][0];
        expect(legendConfig.width).toBe(
            widest.textWidth + widest.symbol.bboxWidth + widest.symbol.padding,
        );
    });

    test.each([
        {width: 1000, names: []},
        {width: 0, names: ['A']},
        {width: 20, names: ['A']},
    ])('handles empty content or unavailable space (%j)', async ({width, names}) => {
        const {legendConfig, legendItems} = await prepareLegend(
            {enabled: true, position: 'left', width: 'auto'},
            width,
            {names},
        );
        expect(legendConfig.width).toBe(0);
        expect(legendConfig.height).toBe(0);
        expect(legendItems).toEqual([]);
    });

    test.each([undefined, 2000, '200%'])(
        'never exceeds available space (maxWidth=%s)',
        async (maxWidth) => {
            const {legendConfig} = await prepareLegend({
                enabled: true,
                position: 'right',
                width: 'auto',
                maxWidth,
            });
            expect(legendConfig.width).toBeLessThanOrEqual(945);
            expect(legendConfig.width).toBeGreaterThan(0);
        },
    );
});

describe('legend maxWidth', () => {
    test.each(['discrete', 'continuous'] as const)(
        'caps resolved pixel and percentage widths without changing config (%s)',
        async (type) => {
            for (const position of ['left', 'right', 'top', 'bottom'] as const) {
                for (const {width, maxWidth, containerWidth, expected} of [
                    {width: '80px', maxWidth: 120, containerWidth: 1000, expected: 80},
                    {width: '50%', maxWidth: '12.5%', containerWidth: 1000, expected: 120},
                    {width: '80px', maxWidth: '-10%', containerWidth: 1000, expected: 0},
                    {width: '2000px', maxWidth: 120, containerWidth: 20, expected: 0},
                    {width: '50%', maxWidth: 120, containerWidth: 0, expected: 0},
                ]) {
                    const legend = Object.freeze({enabled: true, type, position, width, maxWidth});
                    const {legendConfig, preparedLegend} = await prepareLegend(
                        legend,
                        containerWidth,
                    );
                    expect(legendConfig.width).toBe(expected);
                    expect(preparedLegend.width).toBe(width);
                    expect(preparedLegend.maxWidth).toBe(maxWidth);
                    expect(legend.width).toBe(width);
                    expect(legend.maxWidth).toBe(maxWidth);
                }
            }
        },
    );

    test.each([
        {maxWidth: 120, width: undefined, expected: 120},
        {maxWidth: '120px', width: undefined, expected: 120},
        {maxWidth: '12.5%', width: undefined, expected: 120},
        {maxWidth: 120, width: 600, expected: 120},
        {maxWidth: 120, width: 80, expected: 80},
    ])('caps default and explicit widths (%j)', async ({maxWidth, width, expected}) => {
        const {legendConfig, preparedLegend} = await prepareLegend({
            enabled: true,
            position: 'left',
            width,
            maxWidth,
        });
        expect(legendConfig.width).toBe(expected);
        expect(preparedLegend.maxWidth).toBe(maxWidth);
    });

    test.each([0, '-10%'])('clamps nonpositive limits (%s)', async (maxWidth) => {
        const {legendConfig, legendItems} = await prepareLegend({
            enabled: true,
            position: 'right',
            maxWidth,
        });
        expect(legendConfig.width).toBe(0);
        expect(legendConfig.height).toBe(0);
        expect(legendItems).toEqual([]);
    });

    test.each(['invalid', NaN, Infinity])('ignores invalid limits (%s)', async (maxWidth) => {
        const {legendConfig} = await prepareLegend({enabled: true, position: 'left', maxWidth});
        expect(legendConfig.width).toBe(472.5);
    });

    test.each([
        {position: 'left', width: undefined, maxWidth: 120, expected: 120, alignmentWidth: 120},
        {position: 'right', width: 80, maxWidth: 120, expected: 80, alignmentWidth: 80},
        {position: 'top', width: 80, maxWidth: 120, expected: 80, alignmentWidth: 120},
        {position: 'bottom', width: 500, maxWidth: 120, expected: 120, alignmentWidth: 120},
        {position: 'left', width: 600, maxWidth: 800, expected: 600, alignmentWidth: 600},
    ] as const)(
        'caps continuous gradients (%j)',
        async ({position, width, maxWidth, expected, alignmentWidth}) => {
            const {legendConfig} = await prepareLegend({
                enabled: true,
                type: 'continuous',
                position,
                width,
                maxWidth,
            });
            expect(legendConfig.width).toBe(expected);
            expect(legendConfig.maxWidth).toBe(alignmentWidth);
        },
    );
});

describe.each(['discrete', 'continuous'] as const)('%s legend width', (type) => {
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
                const legend = Object.freeze({enabled: true, type, position, width});
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
