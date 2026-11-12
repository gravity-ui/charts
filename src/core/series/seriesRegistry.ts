import {ChartError} from '../../libs';
import type {MeaningfulAny} from '../../types';

import type {SeriesPlugin} from './plugin';

const registry = new Map<string, SeriesPlugin>();

// The heterogeneous registry erases associations here; concrete plugin declarations
// retain their own data types. The chart's public input is still built-in.
export function registerSeriesPlugin<
    T extends SeriesPlugin<MeaningfulAny, MeaningfulAny, MeaningfulAny, MeaningfulAny>,
>(plugin: T) {
    registry.set(plugin.type, plugin);
}

export function getSeriesPlugin(type: string): SeriesPlugin {
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
