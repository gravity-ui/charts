import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderBarX} from '~core/shapes/bar-x/renderer';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import {filterOverlappingLabels} from '~core/utils';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareBarXData} from '~core/shapes/bar-x/prepare-data';
export * from '~core/shapes/bar-x/types';

const b = block('bar-x');

type Args = {
    boundsHeight: number;
    boundsWidth: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedBarXData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const BarXSeriesShapes = (args: Args) => {
    const {
        boundsHeight,
        boundsWidth,
        dispatcher,
        preparedData,
        seriesOptions,
        htmlLayout,
        clipPathId,
    } = args;
    const ref = React.useRef<SVGGElement>(null);
    const annotationsRef = React.useRef<SVGGElement>(null);

    const allowOverlapDataLabels = React.useMemo(() => {
        return preparedData.some((d) => d?.series.dataLabels.allowOverlap);
    }, [preparedData]);

    React.useEffect(() => {
        if (!ref.current || !annotationsRef.current) {
            return () => {};
        }

        return renderBarX(
            {
                plot: ref.current,
                annotations: annotationsRef.current,
                boundsWidth,
                boundsHeight,
            },
            preparedData,
            seriesOptions,
            allowOverlapDataLabels,
            dispatcher,
        );
    }, [
        allowOverlapDataLabels,
        boundsHeight,
        boundsWidth,
        dispatcher,
        preparedData,
        seriesOptions,
    ]);

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
            <g ref={annotationsRef} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
