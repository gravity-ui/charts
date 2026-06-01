import {ChartError} from '../../libs';

import type {SeriesPlugin, TooltipRowDef} from './plugin';

const registry = new Map<string, SeriesPlugin>();

export function registerSeriesPlugin(plugin: SeriesPlugin) {
    // "name" and "value" are required in the primary row — rowRenderer receives them as
    // named args. Can only be validated for static arrays; function form is trusted.
    if (Array.isArray(plugin.tooltip.rows)) {
        const primaryRow: TooltipRowDef | undefined = plugin.tooltip.rows[0];
        const primaryCells = primaryRow?.cells ?? [];
        const ids = new Set(primaryCells.map((cell) => cell.id));
        for (const id of ['name', 'value'] as const) {
            if (!ids.has(id)) {
                throw new ChartError({
                    message: `Plugin "${plugin.type}": tooltip.rows[0].cells is missing required cell id="${id}"`,
                });
            }
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
