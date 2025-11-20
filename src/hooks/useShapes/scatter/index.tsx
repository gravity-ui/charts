import React from 'react';

import {select} from 'd3';
import type {BaseType, Dispatch} from 'd3';
import get from 'lodash/get';

import type {TooltipDataChunkScatter} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';
import {
    getMarkerHaloVisibility,
    renderMarker,
    selectMarkerHalo,
    selectMarkerSymbol,
    setMarker,
} from '../marker';
import {setActiveState, shapeKey} from '../utils';

import type {MarkerData, PreparedScatterData} from './types';
export {prepareScatterData} from './prepare-data';

type ScatterSeriesShapeProps = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedScatterData[];
    seriesOptions: PreparedSeriesOptions;
    clipPathId?: string;
    dispatcher?: Dispatch<object>;
};

const b = block('scatter');

export function ScatterSeriesShape(props: ScatterSeriesShapeProps) {
    const {clipPathId, dispatcher, preparedData, seriesOptions, htmlLayout} = props;
    const hoveredDataRef = React.useRef<TooltipDataChunkScatter[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        const hoverOptions = get(seriesOptions, 'scatter.states.hover');
        const inactiveOptions = get(seriesOptions, 'scatter.states.inactive');

        svgElement.selectAll('*').remove();

        const selection = svgElement
            .selectAll('path')
            .data(preparedData, shapeKey)
            .join('g')
            .call(renderMarker)
            .attr('opacity', (d) => d.point.opacity)
            .attr('cursor', (d) => d.point.series.cursor);

        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        function handleShapeHover(data?: TooltipDataChunkScatter[]) {
            hoveredDataRef.current = data;
            const selected = data?.find((d) => d.series.type === 'scatter');
            const selectedDataItem = selected?.data;
            const selectedSeriesId = selected?.series?.id;

            selection.datum((d, index, list) => {
                const elementSelection = select<BaseType, MarkerData>(list[index]);

                const hovered = Boolean(hoverEnabled && d.point.data === selectedDataItem);
                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    elementSelection.attr('z-index', hovered ? 999 : null);
                    selectMarkerHalo(elementSelection).attr('visibility', getMarkerHaloVisibility);
                    selectMarkerSymbol(elementSelection).call(
                        setMarker,
                        hovered ? 'hover' : 'normal',
                    );
                }

                if (hovered) {
                    elementSelection.raise();
                }

                if (d.point.series.marker.states.normal.enabled) {
                    const isActive = Boolean(
                        !inactiveEnabled ||
                            !selectedSeriesId ||
                            selectedSeriesId === d.point.series.id,
                    );
                    setActiveState<MarkerData>({
                        element: list[index],
                        state: inactiveOptions,
                        active: isActive,
                        datum: d,
                    });
                }
                return d;
            });
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher?.on('hover-shape.scatter', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.scatter', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g
                ref={ref}
                className={b()}
                clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
            />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
