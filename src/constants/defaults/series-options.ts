import type {ChartSeriesOptions, ChartSeriesRangeSliderOptions} from '../../types';

type DefaultBarXSeriesOptions = Partial<ChartSeriesOptions['bar-x']> & {
    'bar-x': {barMaxWidth: number; barPadding: number; groupPadding: number; stackGap: number};
};

type DefaultBarYSeriesOptions = Partial<ChartSeriesOptions['bar-y']> & {
    'bar-y': {barMaxWidth: number; barPadding: number; groupPadding: number; stackGap: number};
};

type DefaultWaterfallSeriesOptions = Partial<ChartSeriesOptions['waterfall']> & {
    waterfall: {barMaxWidth: number; barPadding: number};
};

export type SeriesOptionsDefaults = Partial<ChartSeriesOptions> &
    DefaultBarXSeriesOptions &
    DefaultBarYSeriesOptions &
    DefaultWaterfallSeriesOptions;

export const seriesOptionsDefaults: SeriesOptionsDefaults = {
    'bar-x': {
        barMaxWidth: 50,
        barPadding: 0.1,
        groupPadding: 0.2,
        stackGap: 1,
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
        stackGap: 1,
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
    radar: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
            inactive: {
                enabled: true,
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
    heatmap: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
        },
    },
    funnel: {
        states: {
            hover: {
                enabled: true,
                brightness: 0.3,
            },
        },
    },
};

export const seriesRangeSliderOptionsDefaults: Required<ChartSeriesRangeSliderOptions> = {
    visible: true,
};
