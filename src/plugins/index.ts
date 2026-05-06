import {registerSeriesPlugin} from '~core/series/seriesRegistry';

import {areaPlugin} from './area';
import {barXPlugin} from './bar-x';
import {barYPlugin} from './bar-y';
import {funnelPlugin} from './funnel';
import {heatmapPlugin} from './heatmap';
import {linePlugin} from './line';
import {piePlugin} from './pie';
import {radarPlugin} from './radar';
import {sankeyPlugin} from './sankey';
import {scatterPlugin} from './scatter';
import {treemapPlugin} from './treemap';
import {waterfallPlugin} from './waterfall';
import {xRangePlugin} from './x-range';

registerSeriesPlugin(areaPlugin);
registerSeriesPlugin(barXPlugin);
registerSeriesPlugin(barYPlugin);
registerSeriesPlugin(funnelPlugin);
registerSeriesPlugin(heatmapPlugin);
registerSeriesPlugin(linePlugin);
registerSeriesPlugin(piePlugin);
registerSeriesPlugin(radarPlugin);
registerSeriesPlugin(sankeyPlugin);
registerSeriesPlugin(scatterPlugin);
registerSeriesPlugin(treemapPlugin);
registerSeriesPlugin(waterfallPlugin);
registerSeriesPlugin(xRangePlugin);
