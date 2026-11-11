import type {SymbolType} from '~core/constants';
import type {BasePreparedSeries, PreparedHaloOptions} from '~core/series/types';

import type {
    BaseTextStyle,
    RadarSeries,
    RadarSeriesCategory,
    RadarSeriesData,
    ValueFormat,
} from '../../types';

export type PreparedRadarSeries = {
    type: RadarSeries['type'];
    data: RadarSeriesData[];
    categories: RadarSeriesCategory[];
    borderColor: string;
    borderWidth: number;
    fillOpacity: number;
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
} & BasePreparedSeries;
