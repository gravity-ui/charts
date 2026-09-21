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

async function prepareLegend(legend: ChartLegend) {
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
    const preparedLegend = await getPreparedLegend({legend, series: seriesData});
    const series = await getPreparedSeries({
        seriesData,
        seriesOptions: undefined,
        colors: ['red'],
        preparedLegend,
    });
    const components = await getLegendComponents({
        chartWidth,
        chartHeight: 400,
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
