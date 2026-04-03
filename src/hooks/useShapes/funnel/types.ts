import type {Path} from 'd3-path';

import type {DashStyle} from 'src/core/constants';
import type {PreparedFunnelSeries} from '~core/series/types';

import type {FunnelSeriesData, LabelData} from '../../../types';

export type FunnelItemData = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    series: PreparedFunnelSeries;
    data: FunnelSeriesData;
    borderColor: string;
    borderWidth: number;
    cursor: string | null;
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
};
