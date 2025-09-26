import {sort} from 'd3';

import {SeriesType} from '../../../constants';
import type {ChartSeries} from '../../../types';

export function getSortedSeriesData(seriesData: ChartSeries[]) {
    return seriesData.map((s) => {
        switch (s.type) {
            case SeriesType.Area: {
                s.data = sort(s.data, (d) => d.x);
            }
        }
        return s;
    });
}
