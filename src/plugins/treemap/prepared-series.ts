import type {LayoutAlgorithm} from '~core/constants';
import type {BasePreparedSeries} from '~core/series/types';

import type {BaseTextStyle, TreemapSeries, TreemapSeriesData, ValueFormat} from '../../types';

export type PreparedTreemapSeries = {
    type: TreemapSeries['type'];
    data: TreemapSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        align: Required<Required<TreemapSeries>['dataLabels']>['align'];
        format?: ValueFormat;
    };
    layoutAlgorithm: `${LayoutAlgorithm}`;
    sorting: Required<TreemapSeries['sorting']>;
} & BasePreparedSeries &
    Required<Omit<TreemapSeries, keyof BasePreparedSeries>>;
