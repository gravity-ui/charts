import type {Path} from 'd3-path';

import type {DashStyle} from '~core/constants';
import type {SeriesShapeData} from '~core/shapes/types';
import type {TooltipDataChunkFunnel} from '~core/types';

import type {FunnelSeriesData, LabelData} from '../../types';

import type {PreparedFunnelSeries} from './prepared-series';

export type FunnelItemData = {
    x: number;
    y: number;
    width: number;
    height: number;
    points: [number, number][];
    color: string;
    series: PreparedFunnelSeries;
    data: FunnelSeriesData;
    borderColor: string;
    borderWidth: number;
    cursor: string | null;
    opacity: number | null;
};

export type FunnelConnectorData = {
    linePath: Path[];
    areaPath: Path;
    lineWidth: number;
    lineColor: string;
    lineOpacity: number;
    areaColor: string;
    areaOpacity: number;
    dashStyle: DashStyle;
};

export type PreparedFunnelData = {
    type: 'funnel';
    items: FunnelItemData[];
    connectors: FunnelConnectorData[];
    svgLabels: LabelData[];
} & SeriesShapeData;

export interface FunnelTooltipChunk extends Omit<TooltipDataChunkFunnel, 'series'> {
    series: PreparedFunnelSeries;
}
