import type {PieArcDatum} from 'd3-shape';

import type {ConnectorCurve, LabelData} from '../../../types';
import type {PreparedPieSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type SegmentData = {
    value: number;
    color: string;
    opacity: number | null;
    series: PreparedPieSeries;
    hovered: boolean;
    active: boolean;
    pie: PreparedPieData;
    radius: number;
};

export type PieLabelData = LabelData & {
    segment: SegmentData;
    angle: number;
    maxWidth: number;
};

export type PieConnectorData = {
    path: string | null;
    color: string;
};

export type PreparedPieData = {
    id: string;
    segments: PieArcDatum<SegmentData>[];
    labels: PieLabelData[];
    connectors: PieConnectorData[];
    center: [number, number];
    innerRadius: number;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    series: PreparedPieSeries;
    connectorCurve: ConnectorCurve;
    halo: {
        enabled: boolean;
        opacity: number;
        size: number;
    };
} & SeriesShapeData;
