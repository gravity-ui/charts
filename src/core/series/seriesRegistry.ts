import {ChartError} from '../../libs';

import type {SeriesPlugin} from './plugin';

const registry = new Map<string, SeriesPlugin>();

export function registerSeriesPlugin(plugin: SeriesPlugin) {
    // "name" and "value" are required — rowRenderer receives them as named args;
    // missing cells would cause silent undefined values for every tooltip row.
    const ids = new Set(plugin.tooltip.row.cells.items.map((i) => i.id));
    for (const id of ['name', 'value'] as const) {
        if (!ids.has(id)) {
            throw new ChartError({
                message: `Plugin "${plugin.type}": tooltip.row.cells.items is missing required cell id="${id}"`,
            });
        }
    }
    registry.set(plugin.type, plugin);
}

export function getSeriesPlugin(type: string): SeriesPlugin {
    const plugin = registry.get(type);
    if (!plugin) {
        throw new ChartError({message: `Unknown series type: "${type}"`});
    }
    return plugin;
}
