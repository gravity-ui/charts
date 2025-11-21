import type {Path} from 'd3';

import type {DashStyle} from 'src/constants';

import type {FunnelSeriesData, LabelData} from '../../../types';
import type {PreparedFunnelSeries} from '../../useSeries/types';

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
