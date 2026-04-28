import type {SeriesPlugin} from './series/types';

export class PluginRegistry {
    private plugins = new Map<string, SeriesPlugin>();

    register(plugin: SeriesPlugin): void {
        this.plugins.set(plugin.type, plugin);
    }

    get(type: string): SeriesPlugin | undefined {
        return this.plugins.get(type);
    }

    has(type: string): boolean {
        return this.plugins.has(type);
    }
}

export const pluginRegistry = new PluginRegistry();
