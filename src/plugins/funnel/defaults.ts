import type {ChartSeriesOptions} from '~core/types';

export const funnelDefaults = {
    states: {
        hover: {
            enabled: true,
            brightness: 0.3,
        },
    },
} satisfies NonNullable<ChartSeriesOptions['funnel']>;
