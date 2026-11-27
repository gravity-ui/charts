import type {BasePreparedSeries, PreparedSeriesMarker} from '~core/series/types';

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
    marker: PreparedSeriesMarker;
} & BasePreparedSeries;
