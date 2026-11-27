import type {ChartSeriesOptions} from '~core/types';

export const scatterDefaults = {
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
} satisfies NonNullable<ChartSeriesOptions['scatter']>;
