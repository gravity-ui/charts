import type {BrushSelection} from 'd3-brush';
import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import {ZOOM_TYPE} from '../constants';
import type {ZoomType} from '../constants';
import type {ChartScale} from '../scales/types';

import type {ZoomState} from './types';

export function selectionToZoomBounds(args: {
    selection: BrushSelection;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxes: PreparedYAxis[];
    yScales: (ChartScale | undefined)[];
    zoomType: ZoomType;
}): Partial<ZoomState> {
    const {selection, xAxis, xScale, yAxes, yScales, zoomType} = args;
    const zoomState: Partial<ZoomState> = {};

    switch (zoomType) {
        case ZOOM_TYPE.X: {
            const [x0, x1] = selection as [number, number];
            zoomState.x = selectionXToZoomBounds({xAxis, xScale, selection: [x0, x1]});
            break;
        }
        case ZOOM_TYPE.Y: {
            const [y1, y0] = selection as [number, number];
            yAxes.forEach((yAxis, index) => {
                if (!Array.isArray(zoomState.y)) {
                    zoomState.y = [];
                }

                const yScale = yScales[index];

                if (yScale) {
                    zoomState.y.push(
                        selectionYToZoomBounds({
                            yAxis,
                            yScale,
                            selection: [y1, y0],
                        }),
                    );
                } else {
                    zoomState.y.push(undefined);
                }
            });
            break;
        }
        case ZOOM_TYPE.XY: {
            const [x0, y0] = selection[0] as [number, number];
            const [x1, y1] = selection[1] as [number, number];
            zoomState.x = selectionXToZoomBounds({xAxis, xScale, selection: [x0, x1]});
            yAxes.forEach((yAxis, index) => {
                if (!Array.isArray(zoomState.y)) {
                    zoomState.y = [];
                }

                const yScale = yScales[index];

                if (yScale) {
                    zoomState.y.push(
                        selectionYToZoomBounds({
                            yAxis,
                            yScale,
                            selection: [y0, y1],
                        }),
                    );
                } else {
                    zoomState.y.push(undefined);
                }
            });
            break;
        }
    }

    return zoomState;
}

function selectionXToZoomBounds(args: {
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    selection: [number, number];
}): [number, number] {
    const {xAxis, xScale, selection} = args;

    switch (xAxis.type) {
        case 'category': {
            const [x0, x1] = selection;
            const bandScale = xScale as ScaleBand<string>;
            const categories = xAxis.categories || [];
            const currentDomain = bandScale.domain();
            const step = bandScale.step();
            const rawStart = Math.floor(x0 / step);
            const rawEnd = Math.floor(x1 / step);
            const lastIdx = currentDomain.length - 1;

            if (lastIdx < 0 || rawStart > lastIdx || rawEnd < 0) {
                return [-1, -1];
            }

            const clampedStart = Math.max(0, Math.min(lastIdx, rawStart));
            const clampedEnd = Math.max(0, Math.min(lastIdx, rawEnd));
            const startIndex = categories.indexOf(currentDomain[clampedStart]);
            const endIndex = categories.indexOf(currentDomain[clampedEnd]);

            if (startIndex === -1 || endIndex === -1) {
                return [-1, -1];
            }

            return [startIndex, endIndex];
        }
        case 'datetime': {
            const [x0, x1] = selection;
            const timeScale = xScale as ScaleTime<number, number>;
            const minTimestamp = timeScale.invert(x0).getTime();
            const maxTimestamp = timeScale.invert(x1).getTime();

            return [minTimestamp, maxTimestamp];
        }
        case 'linear':
        case 'logarithmic': {
            const [x0, x1] = selection;
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

function getYMinMaxFromSelection(args: {selection: [number, number]; yAxis: PreparedYAxis}) {
    const {selection, yAxis} = args;
    let yMin: number;
    let yMax: number;

    switch (yAxis.order) {
        case 'reverse':
        case 'sortDesc': {
            [yMin, yMax] = selection;
            break;
        }
        default: {
            [yMax, yMin] = selection;
        }
    }

    return [yMin, yMax];
}

function selectionYToZoomBounds(args: {
    yAxis: PreparedYAxis;
    yScale: ChartScale;
    selection: [number, number];
}): [number, number] {
    const {yAxis, yScale, selection} = args;

    switch (yAxis.type) {
        case 'category': {
            const [y1, y0] = selection;
            const bandScale = yScale as ScaleBand<string>;
            const categories = yAxis.categories || [];
            const currentDomain = bandScale.domain();
            const step = bandScale.step();
            const lastIdx = currentDomain.length - 1;
            const rawStart = lastIdx - Math.floor(y0 / step);
            const rawEnd = lastIdx - Math.floor(y1 / step);

            if (lastIdx < 0 || rawEnd < 0 || rawStart > lastIdx) {
                return [-1, -1];
            }

            const clampedStart = Math.max(0, Math.min(lastIdx, rawStart));
            const clampedEnd = Math.max(0, Math.min(lastIdx, rawEnd));
            const startIndex = categories.indexOf(currentDomain[clampedStart]);
            const endIndex = categories.indexOf(currentDomain[clampedEnd]);

            if (startIndex === -1 || endIndex === -1) {
                return [-1, -1];
            }

            return [startIndex, endIndex];
        }
        case 'datetime': {
            const [yMin, yMax] = getYMinMaxFromSelection({selection, yAxis});
            const timeScale = yScale as ScaleTime<number, number>;
            const minTimestamp = timeScale.invert(yMin).getTime();
            const maxTimestamp = timeScale.invert(yMax).getTime();

            return [minTimestamp, maxTimestamp];
        }
        case 'linear':
        case 'logarithmic': {
            const [yMin, yMax] = getYMinMaxFromSelection({selection, yAxis});
            const linearScale = yScale as ScaleLinear<number, number>;
            const minValue = linearScale.invert(yMin);
            const maxValue = linearScale.invert(yMax);

            return [minValue, maxValue];
        }
        default: {
            throw new Error(`Invalid axis type: ${yAxis.type}`);
        }
    }
}
