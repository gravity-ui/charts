import {pluginRegistry} from '~core/plugins';
import {
    areaPlugin,
    barXPlugin,
    barYPlugin,
    funnelPlugin,
    heatmapPlugin,
    linePlugin,
    piePlugin,
    radarPlugin,
    sankeyPlugin,
    scatterPlugin,
    treemapPlugin,
    waterfallPlugin,
    xRangePlugin,
} from '~core/plugins/series';

pluginRegistry.register(areaPlugin);
pluginRegistry.register(barXPlugin);
pluginRegistry.register(barYPlugin);
pluginRegistry.register(funnelPlugin);
pluginRegistry.register(heatmapPlugin);
pluginRegistry.register(linePlugin);
pluginRegistry.register(piePlugin);
pluginRegistry.register(radarPlugin);
pluginRegistry.register(sankeyPlugin);
pluginRegistry.register(scatterPlugin);
pluginRegistry.register(treemapPlugin);
pluginRegistry.register(waterfallPlugin);
pluginRegistry.register(xRangePlugin);
