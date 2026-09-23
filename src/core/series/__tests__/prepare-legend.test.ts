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
    const preparedLegend = await getPreparedLegend({legend, series: seriesData});
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
                    expect(preparedLegend.width).toBe(width);
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
            expect(preparedLegend.width).toBeUndefined();
            expect(preparedLegend.resolvedWidth).toBe(expectedWidth);
        });

        test('caps an explicit width to the available chart width', async () => {
            const {legendConfig, legendItems, preparedLegend, series} = await prepareLegend({
                enabled: true,
                position,
                width: 2000,
            });
            const availableWidth = chartWidth - chartMargin.left - chartMargin.right;
            expect(preparedLegend.width).toBe(2000);
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
        });

        test.each([
            {width: 0, containerWidth: 1000},
            {width: -10, containerWidth: 1000},
            {width: 600, containerWidth: 20},
            {width: undefined, containerWidth: 20},
        ])('keeps empty legend geometry nonnegative (%j)', async ({width, containerWidth}) => {
            const {legendConfig, legendItems, preparedLegend} = await prepareLegend(
                {enabled: true, position, width},
                containerWidth,
            );
            expect(preparedLegend.width).toBe(width);
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

test.each([undefined, 230])(
    'preserves the continuous gradient width and its available alignment space (width=%s)',
    async (width) => {
        const {legendConfig, preparedLegend} = await prepareLegend({
            enabled: true,
            type: 'continuous',
            width,
        });
        expect(legendConfig.width).toBe(width ?? 200);
        expect(legendConfig.maxWidth).toBe(chartWidth - chartMargin.left - chartMargin.right);
        expect(legendConfig.offset.left).toBe(chartMargin.left);
        expect(preparedLegend.width).toBe(width);
        expect(preparedLegend.resolvedWidth).toBe(width ?? 200);
    },
);

describe('content-based legend width', () => {
    test.each(['left', 'right'] as const)(
        'fits short rows and reserves the resolved width on the %s',
        async (position) => {
            const legend = Object.freeze({
                enabled: true,
                position,
                width: 'auto' as const,
                maxWidth: '30%',
            });
            const {preparedLegend, legendConfig, legendItems, series} = await prepareLegend(
                legend,
                1000,
                {names: ['A', 'BB']},
            );
            const measuredWidth = legendItems[0].reduce(
                (sum, item) => sum + item.textWidth + item.symbol.bboxWidth + item.symbol.padding,
                preparedLegend.itemDistance,
            );
            expect(legendConfig.width).toBe(measuredWidth);
            expect(measuredWidth).toBeLessThan(288);
            expect(
                getChartDimensions({
                    height: 400,
                    width: 1000,
                    margin: chartMargin,
                    preparedLegend,
                    preparedSeries: series,
                    preparedXAxis: null,
                    preparedYAxis: null,
                    legendConfig,
                }).boundsWidth,
            ).toBe(960 - measuredWidth - preparedLegend.margin);
            expect(legend.width).toBe('auto');
            expect(legend.maxWidth).toBe('30%');
        },
    );

    test.each([false, true])('caps long labels and keeps raw text (html=%s)', async (html) => {
        const {legendItems, legendConfig} = await prepareLegend({
            enabled: true,
            position: 'right',
            width: 'auto',
            maxWidth: 100,
            html,
        });
        expect(legendConfig.width).toBeLessThanOrEqual(100);
        for (const item of legendItems.flat()) {
            expect(
                item.textWidth + item.symbol.bboxWidth + item.symbol.padding,
            ).toBeLessThanOrEqual(100);
            expect(item.overflowed).toBe(true);
        }
        expect(legendItems.flat()[2].name).toBe('C'.repeat(100));
    });

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

    test('recalculates on resize and content changes', async () => {
        const legend: ChartLegend = {
            enabled: true,
            position: 'left',
            width: 'auto',
            maxWidth: '25%',
        };
        const result = await prepareLegend(legend);
        const resized = await getLegendComponents({
            chartWidth: 400,
            chartHeight: 400,
            chartMargin,
            series: result.series,
            preparedLegend: result.preparedLegend,
        });
        expect(resized.legendConfig.width).toBeLessThanOrEqual(90);
        const grown = await getLegendComponents({
            chartWidth: 1000,
            chartHeight: 400,
            chartMargin,
            series: result.series,
            preparedLegend: result.preparedLegend,
        });
        expect(grown.legendConfig.width).toBe(result.legendConfig.width);
        const short = await prepareLegend(legend, 1000, {names: ['A']});
        const long = await prepareLegend(legend, 1000, {names: ['AAAA']});
        expect(long.legendConfig.width).toBeGreaterThan(short.legendConfig.width);
    });

    test.each([0, 20, 1000])(
        'handles empty legends and unavailable space (chart width=%s)',
        async (width) => {
            const {legendConfig, legendItems} = await prepareLegend(
                {enabled: true, position: 'left', width: 'auto'},
                width,
                {names: []},
            );
            expect(legendConfig.width).toBe(0);
            expect(legendConfig.height).toBe(0);
            expect(legendItems.flat()).toEqual([]);
        },
    );

    test.each([undefined, 2000, '2000px', '200%', 'invalid', NaN, Infinity])(
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
    test.each([230, '230px', '23.958333333333336%'])(
        'caps omitted and explicit widths (%s)',
        async (maxWidth) => {
            for (const width of [undefined, 600, 100]) {
                const {legendConfig, preparedLegend} = await prepareLegend({
                    enabled: true,
                    position: 'left',
                    width,
                    maxWidth,
                });
                expect(legendConfig.width).toBeCloseTo(width === 100 ? 100 : 230);
                expect(preparedLegend.maxWidth).toBe(maxWidth);
            }
        },
    );

    test.each([0, -1, '-10px', '-10%'])('clamps nonpositive limits (%s)', async (maxWidth) => {
        const {legendConfig, legendItems} = await prepareLegend({
            enabled: true,
            position: 'right',
            maxWidth,
        });
        expect(legendConfig.width).toBe(0);
        expect(legendConfig.height).toBe(0);
        expect(legendItems).toEqual([]);
    });

    test.each(['invalid', '50em', NaN, Infinity])(
        'ignores invalid limits (%s)',
        async (maxWidth) => {
            const {legendConfig} = await prepareLegend({enabled: true, position: 'left', maxWidth});
            expect(legendConfig.width).toBe(472.5);
        },
    );

    test.each(['left', 'right', 'top', 'bottom'] as const)(
        'caps continuous gradients at %s',
        async (position) => {
            for (const width of [undefined, 80, 500]) {
                const {legendConfig} = await prepareLegend({
                    enabled: true,
                    type: 'continuous',
                    position,
                    width,
                    maxWidth: '12.5%',
                });
                expect(legendConfig.width).toBe(width === 80 ? 80 : 120);
                expect(legendConfig.maxWidth).toBe(
                    legendConfig.width === 80 && (position === 'left' || position === 'right')
                        ? 80
                        : 120,
                );
            }
        },
    );
});

test('does not add a half-chart cap to explicit continuous widths with maxWidth', async () => {
    const {legendConfig} = await prepareLegend({
        enabled: true,
        type: 'continuous',
        position: 'left',
        width: 600,
        maxWidth: 800,
    });
    expect(legendConfig.width).toBe(600);
});
