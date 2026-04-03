import type {Dispatch} from 'd3-dispatch';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import get from 'lodash/get';

import type {TooltipDataChunkScatter} from '../../../types';
import type {PreparedSeriesOptions} from '../../series/types';
import {
    getMarkerHaloVisibility,
    renderMarker,
    selectMarkerHalo,
    selectMarkerSymbol,
    setMarker,
} from '../../shapes/marker';
import {setActiveState, shapeKey} from '../../shapes/utils';

import type {MarkerData, PreparedScatterData} from './types';

export function renderScatter(
    elements: {
        plot: SVGGElement;
    },
    preparedData: PreparedScatterData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
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
                selectMarkerSymbol(elementSelection).call(setMarker, hovered ? 'hover' : 'normal');
            }

            if (hovered) {
                elementSelection.raise();
            }

            if (d.point.series.marker.states.normal.enabled) {
                const isActive = Boolean(
                    !inactiveEnabled || !selectedSeriesId || selectedSeriesId === d.point.series.id,
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

    dispatcher?.on('hover-shape.scatter', handleShapeHover);

    return () => {
        dispatcher?.on('hover-shape.scatter', null);
    };
}
