import get from 'lodash/get';

import type {HtmlItem, LabelData, ScatterSeriesData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedScatterSeries} from '../../series/types';
import {getXValue, getYValue} from '../../shapes/utils';
import {filterOverlappingLabels, getDataCategoryValue, preparePointDataLabels} from '../../utils';

import type {PreparedScatterData, PreparedScatterShapeData} from './types';

function getFilteredLinearScatterData(data: ScatterSeriesData[]) {
    return data.filter((d) => typeof d.x === 'number' && typeof d.y === 'number');
}

function getFilteredCategoryScatterData(args: {
    data: ScatterSeriesData[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis;
    yScale: ChartScale;
}) {
    const {data, xAxis, xScale, yAxis, yScale} = args;
    const xDomain = xScale.domain();
    const xCategories = get(xAxis, 'categories', [] as string[]);
    const yDomain = yScale.domain();
    const yCategories = get(yAxis, 'categories', [] as string[]);

    return data.filter((d) => {
        let xInRange = true;
        let yInRange = true;

        if (xAxis.type === 'category') {
            const dataCategory = getDataCategoryValue({
                axisDirection: 'x',
                categories: xCategories,
                data: d,
            });
            xInRange = (xDomain as string[]).indexOf(dataCategory) !== -1;
        }

        if (yAxis.type === 'category') {
            const dataCategory = getDataCategoryValue({
                axisDirection: 'y',
                categories: yCategories,
                data: d,
            });
            yInRange = (yDomain as string[]).indexOf(dataCategory) !== -1;
        }

        return xInRange && yInRange;
    });
}

export async function prepareScatterData(args: {
    series: PreparedScatterSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
}): Promise<PreparedScatterShapeData> {
    const {series, xAxis, xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;

    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax;

    const markers: PreparedScatterData[] = series.reduce<PreparedScatterData[]>((acc, s) => {
        const yAxisIndex = get(s, 'yAxis', 0);
        const seriesYAxis = yAxis[yAxisIndex];
        const seriesYScale = yScale[yAxisIndex];

        if (!seriesYScale) {
            return acc;
        }

        const filteredData =
            xAxis.type === 'category' || seriesYAxis.type === 'category'
                ? getFilteredCategoryScatterData({
                      data: s.data,
                      xAxis,
                      xScale,
                      yAxis: seriesYAxis,
                      yScale: seriesYScale,
                  })
                : getFilteredLinearScatterData(s.data);

        filteredData.forEach((d) => {
            const x = getXValue({point: d, xAxis, xScale});
            const y = getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale});

            if (typeof x === 'undefined' || typeof y === 'undefined' || x === null || y === null) {
                return;
            }

            acc.push({
                point: {
                    data: d,
                    series: s,
                    x,
                    y,
                    opacity: get(d, 'opacity', null),
                    color: d.color ?? s.color,
                },
                hovered: false,
                active: true,
                htmlElements: [],
                clipped: isOutsideBounds(x, y),
            });
        });

        return acc;
    }, []);

    const allSvgLabels: LabelData[] = [];
    const allHtmlLabels: HtmlItem[] = [];

    if (!isRangeSlider) {
        for (const s of series) {
            if (!s.dataLabels.enabled) {
                continue;
            }

            const yAxisIndex = get(s, 'yAxis', 0);
            const seriesYAxis = yAxis[yAxisIndex];
            const seriesYScale = yScale[yAxisIndex];

            if (!seriesYScale) {
                continue;
            }

            const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;

            const seriesPoints = markers
                .filter((m) => m.point.series.id === s.id && !m.clipped)
                .map((m) => m.point);

            const {svgLabels, htmlLabels} = await preparePointDataLabels({
                series: s,
                points: seriesPoints,
                xMax,
                yAxisTop,
                isOutsideBounds,
                anchorYOffset: s.marker.states.normal.radius,
            });

            if (s.dataLabels.allowOverlap) {
                allSvgLabels.push(...svgLabels);
                allHtmlLabels.push(...htmlLabels);
            } else {
                allSvgLabels.push(...filterOverlappingLabels(svgLabels, allSvgLabels));
                allHtmlLabels.push(...filterOverlappingLabels(htmlLabels, allHtmlLabels));
            }
        }
    }

    return {markers, svgLabels: allSvgLabels, htmlLabels: allHtmlLabels};
}
