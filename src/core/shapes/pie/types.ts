import type {PieArcDatum} from 'd3-shape';

import type {ConnectorCurve, HtmlItem, LabelData} from '../../../types';
import type {PreparedPieSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type SegmentData = {
    value: number;
    percentage: number;
    color: string;
    opacity: number | null;
    series: PreparedPieSeries;
    hovered: boolean;
    active: boolean;
    pie: PreparedPieData;
    radius: number;
};

type PieLabelFields = {
    segment: SegmentData;
    angle: number;
    maxWidth: number;
    style: LabelData['style'];
    series: LabelData['series'];
    active?: LabelData['active'];
};

export type PieSvgLabelData = LabelData & PieLabelFields;

export type PieHtmlLabelData = HtmlItem & PieLabelFields;

export type PieLabelData = PieSvgLabelData | PieHtmlLabelData;

export function isPieSvgLabel(label: PieLabelData): label is PieSvgLabelData {
    return 'textAnchor' in label;
}

export function getPieLabelText(label: Partial<PieLabelData> | undefined): string {
    if (!label) {
        return '';
    }

    if ('text' in label) {
        return label.text ?? '';
    }

    if ('content' in label) {
        return label.content ?? '';
    }

    return '';
}

export type PieConnectorData = {
    path: string | null;
    color: string;
};

export type PreparedPieData = {
    id: string;
    segments: PieArcDatum<SegmentData>[];
    labels: PieSvgLabelData[];
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
