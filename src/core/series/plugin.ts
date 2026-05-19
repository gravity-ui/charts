import type {Dispatch} from 'd3-dispatch';
import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartSeries,
    ChartSeriesOptions,
    ChartXAxis,
    ChartYAxis,
    ShapeDataWithLabels,
    TooltipRowCellItem,
} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSplit} from '../layout/split-types';
import type {ChartScale} from '../scales/types';
import type {SeriesShapeData, TooltipItemData} from '../shapes/types';
import type {GetTooltipDataFn} from '../utils/tooltip-helpers';

import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from './types';

export interface PrepareSeriesArgs<T = ChartSeries> {
    series: T[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
    colorScale: ScaleOrdinal<string, string>;
    colors: string[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
}

export interface PrepareShapeDataArgs {
    series: PreparedSeries[];
    boundsWidth: number;
    boundsHeight: number;
    seriesOptions: PreparedSeriesOptions;
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    split?: PreparedSplit;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers?: ShapeDataWithLabels[];
}

export interface PrepareShapeDataResult {
    renderData: SeriesShapeData[];
    tooltipItems: TooltipItemData[];
}

export interface RenderShapesArgs {
    plot: SVGGElement;
    preparedData: SeriesShapeData[];
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    dispatcher?: Dispatch<object>;
}

export interface SeriesPlugin<T extends ChartSeries = ChartSeries> {
    /** Unique series type identifier (e.g. `'line'`, `'bar-x'`). Used for plugin lookup and CSS class generation. */
    type: T['type'];
    /**
     * Whether the shape `<g>` element should be clipped to the chart bounds.
     * Defaults to `true`. Set to `false` for series that render outside the plot area (e.g. pie, radar, treemap).
     */
    useClipPath?: boolean;
    /** Transforms raw chart series config into prepared series objects used throughout the render pipeline. */
    prepareSeries(args: PrepareSeriesArgs): PreparedSeries[] | Promise<PreparedSeries[]>;
    /** Computes shape data (geometry, labels, markers) from prepared series. Called once per render cycle. */
    prepareShapeData(
        args: PrepareShapeDataArgs,
    ): PrepareShapeDataResult | Promise<PrepareShapeDataResult>;
    /** Renders shapes into the provided SVG `<g>` element using D3. May return a cleanup function. */
    renderShapes(args: RenderShapesArgs): (() => void) | void;
    tooltip: {
        /** Returns tooltip data for a given pointer position and prepared series. */
        prepareData: GetTooltipDataFn;
        /** Tooltip row cell rendering. */
        row: {
            cells: {
                /** Default cell list used when the user has not set `row.cells.items`. */
                items: ReadonlyArray<TooltipRowCellItem>;
            };
        };
    };
}
