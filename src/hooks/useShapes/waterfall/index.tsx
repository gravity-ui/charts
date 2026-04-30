import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderWaterfall} from '~core/shapes/waterfall/renderer';
import type {PreparedWaterfallData} from '~core/shapes/waterfall/types';
import {filterOverlappingLabels} from '~core/utils';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareWaterfallData} from '~core/shapes/waterfall/prepare-data';
export * from '~core/shapes/waterfall/types';

const b = block('waterfall');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedWaterfallData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const WaterfallSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId} = args;
    const ref = React.useRef<SVGGElement | null>(null);

    const allowOverlapDataLabels = React.useMemo(() => {
        return preparedData.some((d) => d?.series.dataLabels.allowOverlap);
    }, [preparedData]);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderWaterfall(
            {plot: ref.current},
            preparedData,
            seriesOptions,
            allowOverlapDataLabels,
            dispatcher,
        );
    }, [allowOverlapDataLabels, dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(() => {
        const items = preparedData.map((d) => d?.htmlLabels).flat();
        if (allowOverlapDataLabels) {
            return {htmlElements: items};
        }

        return {htmlElements: filterOverlappingLabels(items)};
    }, [allowOverlapDataLabels, preparedData]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
