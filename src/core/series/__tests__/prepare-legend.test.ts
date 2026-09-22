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

async function prepareLegend(legend: ChartLegend, width = chartWidth) {
    const seriesData: ChartData['series']['data'] = [
        {
            type: 'pie',
            data: [
                {name: 'A'.repeat(20), value: 1},
                {name: 'B'.repeat(20), value: 1},
                {name: 'C'.repeat(100), value: 1},
            ],
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
        chartHeight: 400,
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
            expect(legendConfig.maxWidth).toBe(
                isVertical ? (availableWidth - preparedLegend.margin) / 2 : availableWidth,
            );
            expect(legendConfig.offset.left).toBe(
                position === 'right'
                    ? chartWidth - chartMargin.right - (width ?? 200)
                    : chartMargin.left,
            );
            expect(preparedLegend.resolvedWidth).toBe(width ?? 200);
        }
    },
);

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
        {width: '.5%', containerWidth: 1000, pixels: 4.8, horizontalAlignmentWidth: 960},
        {width: '12.5%', containerWidth: 1000, pixels: 120, horizontalAlignmentWidth: 960},
        {width: '0%', containerWidth: 1000, pixels: 0, horizontalAlignmentWidth: 960},
        {width: '100%', containerWidth: 1000, pixels: 960, horizontalAlignmentWidth: 960},
        {width: '150%', containerWidth: 1000, pixels: 960, horizontalAlignmentWidth: 960},
        {width: '25%', containerWidth: 40, pixels: 0, horizontalAlignmentWidth: 0},
        {width: '25%', containerWidth: 20, pixels: 0, horizontalAlignmentWidth: 0},
        {width: '25%', containerWidth: 0, pixels: 0, horizontalAlignmentWidth: 0},
        {
            width: `${'9'.repeat(308)}%` as ChartLegend['width'],
            containerWidth: 1000,
            pixels: 960,
            horizontalAlignmentWidth: 960,
        },
    ] as const)(
        'resolves width without changing config (%j)',
        async ({width, containerWidth, pixels, horizontalAlignmentWidth}) => {
            const expectedMaxWidths = {
                discrete: {left: pixels, right: pixels, top: pixels, bottom: pixels},
                continuous: {
                    left: pixels,
                    right: pixels,
                    top: horizontalAlignmentWidth,
                    bottom: horizontalAlignmentWidth,
                },
            };
            for (const position of ['left', 'right', 'top', 'bottom'] as const) {
                const legend = Object.freeze({enabled: true, type, position, width});
                const {preparedLegend, legendConfig} = await prepareLegend(legend, containerWidth);
                expect(preparedLegend.resolvedWidth).toBe(pixels);
                expect(legendConfig.width).toBe(pixels);
                expect(legendConfig.maxWidth).toBe(expectedMaxWidths[type][position]);
                expect(legend.width).toBe(width);
            }
        },
    );

    test.each([-10, NaN, '25.%'])(
        'falls back to automatic sizing for invalid input when validation is bypassed (%p)',
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
                expect(legendConfig.maxWidth).toBe(discreteWidth);
            }
        },
    );
});
