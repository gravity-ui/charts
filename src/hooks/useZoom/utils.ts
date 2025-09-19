import type {BrushSelection, ScaleBand, ScaleLinear, ScaleTime} from 'd3';

import type {ChartScale} from '../useAxisScales';
import type {PreparedAxis, PreparedZoom} from '../useChartOptions/types';

import type {ZoomState} from './types';

export function selectionToZoomBounds(args: {
    selection: BrushSelection;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxes: PreparedAxis[];
    yScales: ChartScale[];
    zoomType: PreparedZoom['type'];
}): Partial<ZoomState> {
    const {selection, xAxis, xScale, yAxes, yScales, zoomType} = args;
    const zoomState: Partial<ZoomState> = {};

    switch (zoomType) {
        case 'x': {
            const [x0, x1] = selection as [number, number];
            zoomState.x = selectionXToZoomBounds({xAxis, xScale, selection: [x0, x1]});
            break;
        }
        case 'y': {
            const [y1, y0] = selection as [number, number];
            yAxes.forEach((yAxis, index) => {
                if (!Array.isArray(zoomState.y)) {
                    zoomState.y = [];
                }
                zoomState.y.push(
                    selectionYToZoomBounds({
                        yAxis,
                        yScale: yScales[index],
                        selection: [y1, y0],
                    }),
                );
            });
            break;
        }
        case 'xy': {
            const [x0, y0] = selection[0] as [number, number];
            const [x1, y1] = selection[1] as [number, number];
            zoomState.x = selectionXToZoomBounds({xAxis, xScale, selection: [x0, x1]});
            yAxes.forEach((yAxis, index) => {
                if (!Array.isArray(zoomState.y)) {
                    zoomState.y = [];
                }
                zoomState.y.push(
                    selectionYToZoomBounds({
                        yAxis,
                        yScale: yScales[index],
                        selection: [y0, y1],
                    }),
                );
            });
            break;
        }
    }

    return zoomState;
}

function selectionXToZoomBounds(args: {
    xAxis: PreparedAxis;
    xScale: ChartScale;
    selection: BrushSelection;
}): [number, number] {
    const {xAxis, xScale, selection} = args;

    switch (xAxis.type) {
        case 'category': {
            const [x0, x1] = selection as [number, number];
            const bandScale = xScale as ScaleBand<string>;
            const categories = xAxis.categories || [];
            const currentDomain = bandScale.domain();
            const step = bandScale.step();
            let startIndex = Math.floor(x0 / step);
            let endIndex = Math.floor(x1 / step);
            const startCategory = currentDomain[startIndex];
            const endCategory = currentDomain[endIndex];
            startIndex = categories.indexOf(startCategory);
            endIndex = categories.indexOf(endCategory);

            if (!categories[startIndex]) {
                startIndex = 0;
            }

            if (!categories[endIndex]) {
                endIndex = categories.length - 1;
            }

            return [startIndex, endIndex];
        }
        case 'datetime': {
            const [x0, x1] = selection as [number, number];
            const timeScale = xScale as ScaleTime<number, number>;
            const minTimestamp = timeScale.invert(x0).getTime();
            const maxTimestamp = timeScale.invert(x1).getTime();

            return [minTimestamp, maxTimestamp];
        }
        case 'linear':
        case 'logarithmic': {
            const [x0, x1] = selection as [number, number];
            const linearScale = xScale as ScaleLinear<number, number>;
            const minValue = linearScale.invert(x0);
            const maxValue = linearScale.invert(x1);

            return [minValue, maxValue];
        }
        default: {
            throw new Error(`Invalid axis type: ${xAxis.type}`);
        }
    }
}

function selectionYToZoomBounds(args: {
    yAxis: PreparedAxis;
    yScale: ChartScale;
    selection: BrushSelection;
}): [number, number] {
    const {yAxis, yScale, selection} = args;

    switch (yAxis.type) {
        case 'category': {
            const [y1, y0] = selection as [number, number];
            const bandScale = yScale as ScaleBand<string>;
            const categories = yAxis.categories || [];
            const currentDomain = bandScale.domain();
            const step = bandScale.step();
            let startIndex = currentDomain.length - 1 - Math.floor(y0 / step);
            let endIndex = currentDomain.length - 1 - Math.floor(y1 / step);
            const startCategory = currentDomain[startIndex];
            const endCategory = currentDomain[endIndex];
            startIndex = categories.indexOf(startCategory);
            endIndex = categories.indexOf(endCategory);

            if (!categories[startIndex]) {
                startIndex = 0;
            }

            if (!categories[endIndex]) {
                endIndex = categories.length - 1;
            }

            return [startIndex, endIndex];
        }
        case 'datetime': {
            const [y1, y0] = selection as [number, number];
            const timeScale = yScale as ScaleTime<number, number>;
            const minTimestamp = timeScale.invert(y0).getTime();
            const maxTimestamp = timeScale.invert(y1).getTime();

            return [minTimestamp, maxTimestamp];
        }
        case 'linear':
        case 'logarithmic': {
            const [y1, y0] = selection as [number, number];
            const linearScale = yScale as ScaleLinear<number, number>;
            const minValue = linearScale.invert(y0);
            const maxValue = linearScale.invert(y1);

            return [minValue, maxValue];
        }
        default: {
            throw new Error(`Invalid axis type: ${yAxis.type}`);
        }
    }
}
