import {ChartError} from '../../libs';

import type {SeriesPlugin} from './plugin';

const registry = new Map<string, SeriesPlugin>();

export function registerSeriesPlugin(plugin: SeriesPlugin) {
    registry.set(plugin.type, plugin);
}

export function getSeriesPlugin(type: string): SeriesPlugin {
    const plugin = registry.get(type);
    if (!plugin) {
        throw new ChartError({message: `Unknown series type: "${type}"`});
    }
    return plugin;
}
