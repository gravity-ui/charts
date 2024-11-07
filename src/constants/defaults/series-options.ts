import type {ChartKitWidgetSeriesOptions} from '../../types';

type DefaultBarXSeriesOptions = Partial<ChartKitWidgetSeriesOptions['bar-x']> & {
    'bar-x': {barMaxWidth: number; barPadding: number; groupPadding: number};
};

type DefaultBarYSeriesOptions = Partial<ChartKitWidgetSeriesOptions['bar-x']> & {
    'bar-y': {barMaxWidth: number; barPadding: number; groupPadding: number};
};

type DefaultWaterfallSeriesOptions = Partial<ChartKitWidgetSeriesOptions['waterfall']> & {
    waterfall: {barMaxWidth: number; barPadding: number};
};

export type SeriesOptionsDefaults = Partial<ChartKitWidgetSeriesOptions> &
    DefaultBarXSeriesOptions &
    DefaultBarYSeriesOptions &
    DefaultWaterfallSeriesOptions;

export const seriesOptionsDefaults: SeriesOptionsDefaults = {
    'bar-x': {
        barMaxWidth: 50,
        barPadding: 0.1,
        groupPadding: 0.2,
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    'bar-y': {
        barMaxWidth: 50,
        barPadding: 0.1,
        groupPadding: 0.2,
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    pie: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    scatter: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    line: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    area: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    treemap: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
    waterfall: {
        barMaxWidth: 50,
        barPadding: 0.1,
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: false,
                opacity: 0.5,
            },
        },
    },
};
