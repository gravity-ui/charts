import React from 'react';

import isEqual from 'lodash/isEqual';

import type {LegendItem, PreparedChart, PreparedLegend, PreparedSeries} from '../../hooks';
import {getLegendComponents} from '../../hooks/useSeries/prepare-legend';
import type {LegendConfig} from '../../types';

type LegendState = {
    legendConfig?: LegendConfig;
    legendItems: LegendItem[][];
};

export function useLegend({
    preparedLegend,
    preparedChart,
    preparedSeries,
    width,
    height,
}: {
    preparedLegend: PreparedLegend | null;
    preparedChart: PreparedChart;
    preparedSeries: PreparedSeries[];
    width: number;
    height: number;
}) {
    const [legendState, setLegend] = React.useState<LegendState>({
        legendConfig: undefined,
        legendItems: [],
    });
    const legendStateRunRef = React.useRef(0);
    const prevLegendStateValue = React.useRef(legendState);
    const legendStateReady = React.useRef(false);

    React.useEffect(() => {
        legendStateRunRef.current++;
        legendStateReady.current = false;

        (async function () {
            const currentRun = legendStateRunRef.current;
            if (!preparedLegend) {
                return;
            }

            const newStateValue = await getLegendComponents({
                chartWidth: width,
                chartHeight: height,
                chartMargin: preparedChart.margin,
                series: preparedSeries,
                preparedLegend,
            });

            if (legendStateRunRef.current === currentRun) {
                if (!isEqual(prevLegendStateValue.current, newStateValue)) {
                    setLegend(newStateValue);
                    prevLegendStateValue.current = newStateValue;
                }

                legendStateReady.current = true;
            }
        })();
    }, [height, preparedChart.margin, preparedLegend, preparedSeries, width]);

    return legendState;
}
