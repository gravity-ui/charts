import type {ChartSeriesOptions} from '~core/types';

export const xRangeDefaults = {
    borderRadius: 0,
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
} satisfies NonNullable<ChartSeriesOptions['x-range']>;
