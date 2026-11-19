import {ChartError} from '../../libs';
import type {MeaningfulAny} from '../../types';

import type {SeriesPlugin, SeriesPluginTypes} from './plugin';

/** Heterogeneous storage erases payload types; each plugin checks its own hooks before registration. */
export type RegisteredSeriesPlugin = SeriesPlugin<{
    [Key in keyof Required<SeriesPluginTypes>]: MeaningfulAny;
}>;

interface PluginRegistration extends Omit<RegisteredSeriesPlugin, 'series'> {
    series: Omit<RegisteredSeriesPlugin['series'], 'prepare'> &
        Pick<SeriesPlugin['series'], 'prepare'>;
}

const registry = new Map<string, RegisteredSeriesPlugin>();

// Check preparation against common metadata before erasing concrete plugin types
// in storage. The chart's public input is still built-in.
export function registerSeriesPlugin<T extends PluginRegistration>(plugin: T) {
    registry.set(plugin.type, plugin);
}

export function getSeriesPlugin(type: string): RegisteredSeriesPlugin {
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
