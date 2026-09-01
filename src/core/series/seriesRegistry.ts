import {ChartError} from '../../libs';
import type {ChartSeries, MeaningfulAny} from '../../types';

import type {SeriesPlugin} from './plugin';

const registry = new Map<string, SeriesPlugin<MeaningfulAny>>();

export function registerSeriesPlugin<T extends ChartSeries>(plugin: SeriesPlugin<T>) {
    registry.set(plugin.type, plugin);
}

export function getSeriesPlugin(type: string): SeriesPlugin<MeaningfulAny> {
    const plugin = registry.get(type);
    if (!plugin) {
        throw new ChartError({message: `Unknown series type: "${type}"`});
    }
    return plugin;
}

export function hasSeriesPlugin(type: string): boolean {
    return registry.has(type);
}

export function getRegisteredSeriesTypes(): string[] {
    return [...registry.keys()];
}
