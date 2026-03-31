import type {AxisDomain, AxisScale} from 'd3-axis';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';
import get from 'lodash/get';

import type {ChartScale} from '~core/scales/types';
import {getDataCategoryValue, getLabelsSize} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';

import type {HtmlItem} from '../../../types';
import {MIN_BAR_WIDTH} from '../../constants';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {PreparedXRangeSeries} from '../../useSeries/types';
import {getBandSize} from '../../utils/get-band-size';

import type {PreparedXRangeData} from './types';

const DEFAULT_BAR_PADDING = 0.2;

type PrepareXRangeDataArgs = {
    series: PreparedXRangeSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
};

export async function prepareXRangeData(
    args: PrepareXRangeDataArgs,
): Promise<PreparedXRangeData[]> {
    const {
        series,
        xAxis,
        xScale,
        yAxis,
        yScale: [yScale],
    } = args;

    if (!yScale) {
        return [];
    }

    // Collect unique y-domain values
    const domain: AxisDomain[] = [];
    const seen = new Set<string | number>();
    const categories = get(yAxis[0], 'categories', [] as string[]);

    series.forEach((s) => {
        s.data.forEach((d) => {
            const key =
                yAxis[0].type === 'category'
                    ? getDataCategoryValue({axisDirection: 'y', categories, data: d})
                    : d.y;
            if (key !== undefined && !seen.has(key as string | number)) {
                seen.add(key as string | number);
                domain.push(key as AxisDomain);
            }
        });
    });

    const bandSize = getBandSize({domain, scale: yScale as AxisScale<AxisDomain>});
    const barSize = Math.max(MIN_BAR_WIDTH, bandSize * (1 - DEFAULT_BAR_PADDING));

    const result: PreparedXRangeData[] = [];

    series.forEach((s) => {
        s.data.forEach((d) => {
            let center: number;

            if (yAxis[0].type === 'category') {
                const bandScale = yScale as ScaleBand<string>;
                const yCategory = getDataCategoryValue({axisDirection: 'y', categories, data: d});

                if (!bandScale.domain().includes(yCategory)) {
                    return;
                }

                center = (bandScale(yCategory) || 0) + bandSize / 2;
            } else {
                const linearScale = yScale as
                    | ScaleLinear<number, number>
                    | ScaleTime<number, number>;
                if (d.y === undefined) {
                    return;
                }
                center = linearScale(Number(d.y));
            }

            let xStart: number;
            let xEnd: number;

            if (xAxis.type === 'category') {
                // x-range on a category x-axis is unusual but supported
                const xBandScale = xScale as ScaleBand<string>;
                const xCategories = get(xAxis, 'categories', [] as string[]);
                const startCategory = getDataCategoryValue({
                    axisDirection: 'x',
                    categories: xCategories,
                    data: {x: d.x0},
                });
                const endCategory = getDataCategoryValue({
                    axisDirection: 'x',
                    categories: xCategories,
                    data: {x: d.x1},
                });
                xStart = xBandScale(startCategory) || 0;
                xEnd = (xBandScale(endCategory) || 0) + xBandScale.bandwidth();
            } else {
                const linearScale = xScale as
                    | ScaleLinear<number, number>
                    | ScaleTime<number, number>;
                xStart = linearScale(Number(d.x0));
                xEnd = linearScale(Number(d.x1));
            }

            const width = xEnd - xStart;
            if (width <= 0) {
                return;
            }

            result.push({
                x: xStart,
                y: center - barSize / 2,
                width,
                height: barSize,
                color: d.color || s.color,
                data: d,
                series: s,
                htmlElements: [],
            });
        });
    });

    for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const {dataLabels} = item.series;

        if (!dataLabels.enabled || item.data.label === null) {
            continue;
        }

        const content = getFormattedValue({value: item.data.label, ...dataLabels});
        const {maxHeight: height, maxWidth: width} = await getLabelsSize({
            labels: [content],
            style: dataLabels.style,
            html: dataLabels.html,
        });

        const x = item.x + item.width / 2 - width / 2;
        const y = item.y + item.height / 2 - height / 2;

        if (dataLabels.html) {
            const htmlItem: HtmlItem = {
                content,
                size: {width, height},
                style: dataLabels.style,
                x,
                y,
            };
            item.htmlElements.push(htmlItem);
        }
    }

    return result;
}
