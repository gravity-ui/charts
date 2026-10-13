import type {MeaningfulAny} from '../types';

import type {AreaInteractionItem} from './area/interaction-types';
import type {AreaRangeInteractionItem} from './area-range/interaction-types';
import type {BarXInteractionItem} from './bar-x/interaction-types';
import type {BarYInteractionItem} from './bar-y/interaction-types';
import type {FunnelInteractionItem} from './funnel/interaction-types';
import type {HeatmapInteractionItem} from './heatmap/interaction-types';
import type {LineInteractionItem} from './line/interaction-types';
import type {PieInteractionItem} from './pie/interaction-types';
import type {RadarInteractionItem} from './radar/interaction-types';
import type {SankeyInteractionItem} from './sankey/interaction-types';
import type {ScatterInteractionItem} from './scatter/interaction-types';
import type {TreemapInteractionItem} from './treemap/interaction-types';
import type {WaterfallInteractionItem} from './waterfall/interaction-types';
import type {XRangeInteractionItem} from './x-range/interaction-types';

export type {ChartSankeyLinkPoint} from './sankey/interaction-types';

/** Public aggregation; each plugin owns the payload of its interaction items. */
export type BuiltInInteractionItem<T = MeaningfulAny> =
    | BarXInteractionItem<T>
    | BarYInteractionItem<T>
    | PieInteractionItem<T>
    | HeatmapInteractionItem<T>
    | TreemapInteractionItem<T>
    | ScatterInteractionItem<T>
    | WaterfallInteractionItem<T>
    | FunnelInteractionItem<T>
    | XRangeInteractionItem<T>
    | LineInteractionItem<T>
    | AreaInteractionItem<T>
    | AreaRangeInteractionItem<T>
    | RadarInteractionItem<T>
    | SankeyInteractionItem<T>;
