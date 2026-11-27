import type {ChartSeriesOptions} from '~core/types';

export const radarDefaults = {
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
} satisfies NonNullable<ChartSeriesOptions['radar']>;
