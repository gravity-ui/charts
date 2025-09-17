import {curveLinearClosed, line, range, scaleLinear} from 'd3';

import type {HtmlItem} from '../../../types';
import {getLabelsSize} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedRadarSeries} from '../../useSeries/types';

import type {PreparedRadarData, RadarGridData, RadarMarkerData} from './types';

type Args = {
    series: PreparedRadarSeries[];
    boundsWidth: number;
    boundsHeight: number;
};

export async function prepareRadarData(args: Args): Promise<PreparedRadarData[]> {
    const {series: preparedSeries, boundsWidth, boundsHeight} = args;
    const maxRadius = Math.min(boundsWidth, boundsHeight) / 2;
    const center: [number, number] = [boundsWidth / 2, boundsHeight / 2];

    const result: PreparedRadarData[] = [];

    const gridStepsCount = 5;
    const radius = maxRadius * 0.8; // Leave some space for labels
    // Create scale for values
    const valueScale = scaleLinear()
        .domain([0, Math.max(...preparedSeries.map((s) => s.data.map((d) => d.value)).flat())])
        .range([0, radius]);

    const [, finalRadius] = valueScale.range();

    const data: PreparedRadarData = {
        type: 'radar',
        id: preparedSeries[0].id,
        center,
        radius: finalRadius,
        shapes: [],
        labels: [],
        axes: [],
        htmlLabels: [],
        grid: [],
        cursor: preparedSeries[0].cursor,
    };

    const categories = preparedSeries[0].categories;
    const axisStrokeColor = 'var(--g-color-line-generic)';
    const axisStrokeWidth = 1;

    // Create axes based on categories
    const axesCount = categories.length;
    const angleStep = (2 * Math.PI) / axesCount;
    data.axes = categories.map((_category, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top (negative PI/2)
        return {
            point: [
                center[0] + Math.cos(angle) * data.radius,
                center[1] + Math.sin(angle) * data.radius,
            ],
            radar: data,
            strokeColor: axisStrokeColor,
            strokeWidth: axisStrokeWidth,
            angle,
        };
    });

    const gridStepInc = data.radius / gridStepsCount;
    const gridSteps = range(gridStepInc, data.radius + gridStepInc, gridStepInc);

    gridSteps.forEach((gridStep) => {
        const gridLines: RadarGridData = {
            path: [],
            strokeColor: axisStrokeColor,
            strokeWidth: axisStrokeWidth,
        };
        categories.forEach((_category, index) => {
            const angle = index * angleStep - Math.PI / 2; // Start from top (negative PI/2)
            gridLines.path.push([
                center[0] + Math.cos(angle) * gridStep,
                center[1] + Math.sin(angle) * gridStep,
            ]);
        });
        data.grid.push(gridLines);
    });

    const radarAreaLine = line().curve(curveLinearClosed);
    await Promise.all(
        preparedSeries.map(async (series) => {
            const {dataLabels} = series;

            const markers: RadarMarkerData[] = [];
            categories.forEach((category, index) => {
                const dataItem = series.data[index];
                const angle = index * angleStep - Math.PI / 2; // Start from top (negative PI/2)
                const pointValueScale = scaleLinear()
                    .domain([
                        0,
                        category.maxValue ??
                            Math.max(...preparedSeries.map((s) => s.data[index].value)),
                    ])
                    .range([0, radius]);

                const pointRadius = pointValueScale(dataItem.value);
                const x = center[0] + Math.cos(angle) * pointRadius;
                const y = center[1] + Math.sin(angle) * pointRadius;
                markers.push({
                    point: {
                        x,
                        y,
                        series,
                        data: dataItem,
                    },
                    index,
                    position: [x, y],
                    color: series.color,
                    opacity: 1,
                    radius: 2,
                    data: dataItem,
                    series: series,
                    hovered: false,
                    active: false,
                });
            });

            data.shapes.push({
                borderWidth: series.borderWidth,
                borderColor: series.borderColor,
                fillOpacity: series.fillOpacity,
                points: markers,
                path: radarAreaLine(markers.map((p) => p.position)) ?? '',
                series: series,
                color: series.color,
                hovered: false,
                active: true,
            });

            // Create labels if enabled
            if (dataLabels.enabled) {
                const {style} = dataLabels;
                const shouldUseHtml = dataLabels.html;
                data.labels = await Promise.all(
                    categories.map(async (category, index) => {
                        const text = getFormattedValue({
                            value: category.key,
                            ...dataLabels,
                        });
                        const labelSize = await getLabelsSize({labels: [text], style});
                        const angle = index * angleStep - Math.PI / 2;

                        // Position label slightly outside the point
                        const labelRadius = data.radius + 10;
                        let x = center[0] + Math.cos(angle) * labelRadius;
                        let y = center[1] + Math.sin(angle) * labelRadius;

                        if (shouldUseHtml) {
                            x = x < center[0] ? x - labelSize.maxWidth : x;
                            y = y - labelSize.maxHeight;
                        } else {
                            y = y < center[1] ? y - labelSize.maxHeight : y;
                        }

                        x = Math.max(-boundsWidth / 2, x);

                        return {
                            text,
                            x,
                            y,
                            style,
                            size: {width: labelSize.maxWidth, height: labelSize.maxHeight},
                            maxWidth: labelSize.maxWidth,
                            textAnchor:
                                angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? 'end' : 'start',
                            series: {id: series.id},
                        };
                    }),
                );

                // Create HTML labels if needed
                if (dataLabels.html) {
                    data.htmlLabels = data.labels.map<HtmlItem>((label) => ({
                        x: label.x,
                        y: label.y,
                        content: label.text,
                        size: label.size,
                        style: label.style,
                    }));
                }
            }
        }),
    );

    result.push(data);

    return result;
}
