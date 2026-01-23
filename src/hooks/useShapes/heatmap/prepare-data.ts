import type {AxisDomain, AxisScale, ScaleLinear, ScaleTime} from 'd3';

import type {PreparedXAxis, PreparedYAxis} from '../../../hooks/useAxis/types';
import type {ChartScale} from '../../../hooks/useAxisScales/types';
import {getBandSize} from '../../../hooks/utils/get-band-size';
import type {BaseTextStyle, HtmlItem} from '../../../types';
import {
    getDomainDataXBySeries,
    getDomainDataYBySeries,
    getFormattedValue,
    getLabelsSize,
    getTextSizeFn,
    getTextWithElipsis,
    isBandScale,
} from '../../../utils';
import type {PreparedHeatmapSeries} from '../../useSeries/types';

import type {HeatmapItem, HeatmapLabel, PreparedHeatmapData} from './types';

type PrepareHeatmapDataArgs = {
    series: PreparedHeatmapSeries;
    xAxis: PreparedXAxis;
    yAxis: PreparedYAxis;
    xScale: ChartScale;
    yScale: ChartScale;
};

export async function prepareHeatmapData({
    series,
    xAxis,
    xScale,
    yAxis,
    yScale,
}: PrepareHeatmapDataArgs) {
    const yDomainData = getDomainDataYBySeries([series]) as AxisDomain[];
    const bandHeight = getBandSize({domain: yDomainData, scale: yScale as AxisScale<AxisDomain>});
    const yAxisCategories = yAxis.categories ?? [];

    const xDomainData = getDomainDataXBySeries([series]) as AxisDomain[];
    const bandWidth = getBandSize({domain: xDomainData, scale: xScale as AxisScale<AxisDomain>});
    const xAxisCategories = xAxis.categories ?? [];

    const heatmapItems: HeatmapItem[] = series.data.reduce<HeatmapItem[]>((items, d) => {
        if (d.value === null) {
            return items;
        }

        let x = 0;
        if (isBandScale(xScale)) {
            x = xScale(xAxisCategories[d.x as number]) ?? 0;
        } else {
            const scale = xScale as ScaleLinear<number, number> | ScaleTime<number, number>;
            x = scale(d.x as number) - bandWidth / 2;
        }

        let y = 0;
        if (isBandScale(yScale)) {
            y = yScale(yAxisCategories[d.y as number]) ?? 0;
        } else {
            const scale = yScale as ScaleLinear<number, number> | ScaleTime<number, number>;
            y = scale(d.y as number) - bandHeight / 2;
        }

        const item: HeatmapItem = {
            x,
            y,
            color: d.color ?? series.color,
            width: bandWidth,
            height: bandHeight,
            borderColor: series.borderColor,
            borderWidth: series.borderWidth,
            data: d,
        };

        items.push(item);
        return items;
    }, []);

    const svgDataLabels: HeatmapLabel[] = [];
    const htmlDataLabels: HtmlItem[] = [];
    if (series.dataLabels.enabled) {
        if (series.dataLabels.html) {
            for (let i = 0; i < heatmapItems.length; i++) {
                const item = heatmapItems[i];
                const labelContent =
                    item.data.label ??
                    getFormattedValue({value: item.data.value, format: series.dataLabels.format});
                if (labelContent) {
                    const dataLabelsStyle: BaseTextStyle & React.CSSProperties = {
                        ...series.dataLabels.style,
                        maxWidth: `${item.width}px`,
                        maxHeight: `${item.height}px`,
                        overflow: 'hidden',
                    };
                    const {maxHeight: height, maxWidth: width} =
                        (await getLabelsSize({
                            labels: [labelContent],
                            style: dataLabelsStyle,
                            html: true,
                        })) ?? {};
                    const size = {width, height};
                    htmlDataLabels.push({
                        x: item.x + item.width / 2 - size.width / 2,
                        y: item.y + item.height / 2 - size.height / 2,
                        content: labelContent,
                        style: dataLabelsStyle,
                        size,
                    });
                }
            }
        } else {
            const getTextSize = getTextSizeFn({style: series.dataLabels.style});
            for (let i = 0; i < heatmapItems.length; i++) {
                const item = heatmapItems[i];
                const labelContent =
                    item.data.label ??
                    getFormattedValue({value: item.data.value, format: series.dataLabels.format});
                if (labelContent) {
                    const size = await getTextSize(labelContent);
                    const text = await getTextWithElipsis({
                        text: labelContent,
                        getTextWidth: (s) => getTextSize(s).then((value) => value.width),
                        maxWidth: item.width,
                    });

                    if (text) {
                        svgDataLabels.push({
                            x: item.x + item.width / 2 - size.width / 2,
                            y: item.y + item.height / 2 - size.height / 2,
                            text,
                            style: series.dataLabels.style,
                        });
                    }
                }
            }
        }
    }

    const preparedData: PreparedHeatmapData = {
        series: series,
        htmlElements: htmlDataLabels,
        items: heatmapItems,
        labels: svgDataLabels,
    };

    return preparedData;
}
