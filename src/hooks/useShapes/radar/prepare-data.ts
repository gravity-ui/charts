import {scaleLinear} from 'd3';

import type {HtmlItem} from '../../../types';
import {getLabelsSize} from '../../../utils';
import type {PreparedRadarSeries} from '../../useSeries/types';

import type {PreparedRadarData} from './types';

type Args = {
    series: PreparedRadarSeries[];
    boundsWidth: number;
    boundsHeight: number;
};

export function prepareRadarData(args: Args): PreparedRadarData[] {
    const {series: preparedSeries, boundsWidth, boundsHeight} = args;
    const maxRadius = Math.min(boundsWidth, boundsHeight) / 2;
    const center: [number, number] = [boundsWidth / 2, boundsHeight / 2];

    const prepareItem = (series: PreparedRadarSeries): PreparedRadarData => {
        const {borderWidth, borderColor, fillOpacity, dataLabels, categories = []} = series;

        const data: PreparedRadarData = {
            id: `radar-${series.id}`,
            center,
            radius: maxRadius * 0.8, // Leave some space for labels
            points: [],
            labels: [],
            axes: [],
            htmlLabels: [],
            borderColor,
            borderWidth,
            fillOpacity,
            series,
        };

        // Create axes based on categories
        const axesCount = categories.length;
        const angleStep = (2 * Math.PI) / axesCount;

        data.axes = categories.map((category, index) => {
            const angle = index * angleStep - Math.PI / 2; // Start from top (negative PI/2)
            // Categories are strings
            const categoryName = category || `Category ${index}`;

            return {
                name: categoryName,
                angle,
                x1: center[0],
                y1: center[1],
                x2: center[0] + Math.cos(angle) * data.radius,
                y2: center[1] + Math.sin(angle) * data.radius,
            };
        });

        // Create scale for values
        const valueScale = scaleLinear()
            .domain([0, Math.max(...series.data.map((d) => d.value))])
            .range([0, data.radius]);

        // Create points
        data.points = series.data.map((dataItem, index) => {
            const angle = index * angleStep - Math.PI / 2; // Start from top (negative PI/2)
            const radius = valueScale(dataItem.value);
            const x = center[0] + Math.cos(angle) * radius;
            const y = center[1] + Math.sin(angle) * radius;

            return {
                value: dataItem.value,
                color: series.color,
                opacity: dataItem.opacity ?? null,
                series,
                hovered: false,
                active: true,
                radar: data,
                x,
                y,
                index,
            };
        });

        // Create labels if enabled
        if (dataLabels.enabled) {
            const {style} = dataLabels;
            const shouldUseHtml = dataLabels.html;
            data.labels = data.points.map((point, index) => {
                const text = categories[point.index];
                const labelSize = getLabelsSize({labels: [text], style});
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
                    textAnchor: angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? 'end' : 'start',
                    series: {id: series.id},
                    active: true,
                    point,
                };
            });

            // Create HTML labels if needed
            if (dataLabels.html) {
                data.htmlLabels = data.labels.map<HtmlItem>((label) => ({
                    x: label.x,
                    y: label.y,
                    content: label.text,
                    size: label.size,
                }));
            }
        }

        return data;
    };

    return preparedSeries.map(prepareItem);
}
