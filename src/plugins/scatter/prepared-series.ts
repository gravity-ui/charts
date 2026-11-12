import type {SymbolType} from '~core/constants';
import type {
    BasePreparedAxisRelatedSeries,
    BasePreparedSeries,
    PreparedHaloOptions,
} from '~core/series/types';
import type {PointMarkerOptions} from '~core/types/chart/marker';

import type {BaseTextStyle, ScatterSeries, ScatterSeriesData, ValueFormat} from '../../types';

export type PreparedScatterSeries = {
    type: ScatterSeries['type'];
    data: ScatterSeriesData[];
    cluster: {
        enabled: boolean;
        layoutAlgorithm: {type: 'grid'; gridSize: number | string};
        overlapMode: 'allow' | 'shift';
        minimumClusterSize: number;
        marker: Required<Omit<PointMarkerOptions, 'color'>> & Pick<PointMarkerOptions, 'color'>;
        dataLabels: {
            enabled: boolean;
            allowOverlap: boolean;
            format?: ValueFormat;
            style: BaseTextStyle;
        };
    };
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: ValueFormat;
    };
    marker: {
        states: {
            normal: {
                symbol: `${SymbolType}`;
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
            };
            hover: {
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
                halo: PreparedHaloOptions;
            };
        };
    };
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;
