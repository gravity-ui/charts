import type {BasePreparedSeries, PreparedHaloOptions} from '~core/series/types';

import type {
    BaseTextStyle,
    ConnectorCurve,
    ConnectorShape,
    PieSeries,
    PieSeriesData,
    PieValueFormat,
} from '../../types';

export type PreparedPieSeries = {
    type: PieSeries['type'];
    data: PieSeriesData;
    value: PieSeriesData['value'];
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    center?: [string | number | null, string | number | null];
    radius?: string | number;
    innerRadius?: string | number;
    minRadius?: string | number;
    stackId: string;
    label?: PieSeriesData['label'];
    dataLabels: {
        enabled: boolean;
        padding: number;
        style: BaseTextStyle;
        allowOverlap: boolean;
        connectorPadding: number;
        connectorShape: ConnectorShape;
        distance: number;
        connectorCurve: ConnectorCurve;
        html: boolean;
        format?: PieValueFormat;
    };
    states: {
        hover: {
            halo: PreparedHaloOptions;
        };
    };
    renderCustomShape?: PieSeries['renderCustomShape'];
    opacity: number | null;
} & BasePreparedSeries<PieSeries['tooltip']>;
