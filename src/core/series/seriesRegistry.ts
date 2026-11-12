import {ChartError} from '../../libs';
import type {MeaningfulAny} from '../../types';

import type {SeriesPlugin} from './plugin';

const registry = new Map<
    string,
    SeriesPlugin<{
        raw: MeaningfulAny;
        prepared: MeaningfulAny;
        shape: MeaningfulAny;
        options: MeaningfulAny;
        tooltipItem: MeaningfulAny;
        tooltipChunk: MeaningfulAny;
        formatContext: MeaningfulAny;
        interaction: MeaningfulAny;
        allRaw: MeaningfulAny;
        allPrepared: MeaningfulAny;
    }>
>();

// Check preparation against common metadata before erasing concrete plugin types
// in storage. The chart's public input is still built-in.
export function registerSeriesPlugin<
    T extends Omit<ReturnType<typeof getSeriesPlugin>, 'prepareSeries'> &
        Pick<SeriesPlugin, 'prepareSeries'>,
>(plugin: T) {
    registry.set(plugin.type, plugin);
}

export function getSeriesPlugin(type: string) {
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
