import {ChartError} from '../../libs';
import type {
    ChartInteractionItem,
    ChartSeries,
    ChartSeriesOptions,
    CustomFormatContext,
    MeaningfulAny,
    TooltipDataChunk,
} from '../../types';

import type {SeriesPlugin, SeriesPluginData} from './plugin';
import type {PreparedSeries, PreparedSeriesOptions} from './types';

// A heterogeneous registry erases associations only at lookup; plugin declarations and
// registration retain their complete contracts. The chart's public input is still built-in.
type RuntimeSeriesPlugin = SeriesPlugin<MeaningfulAny, MeaningfulAny, MeaningfulAny, MeaningfulAny>;

interface RegisteredPluginData extends SeriesPluginData {
    prepared: PreparedSeries;
    shape: MeaningfulAny;
    tooltipItem: MeaningfulAny;
    interaction: ChartInteractionItem;
    options: ChartSeriesOptions;
    preparedOptions: PreparedSeriesOptions;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}

export type RegisteredSeriesPlugin = SeriesPlugin<
    ChartSeries,
    TooltipDataChunk,
    CustomFormatContext,
    RegisteredPluginData
>;

const registry = new Map<string, RuntimeSeriesPlugin>();

export function registerSeriesPlugin<T extends RuntimeSeriesPlugin>(plugin: T) {
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
