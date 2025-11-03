import React from 'react';

import {brush, brushX, brushY, select} from 'd3';
import type {BrushBehavior, Selection} from 'd3';

import {block} from '../../utils';

import type {UseBrushProps} from './types';
import {setBrushBorder, setBrushHandles} from './utils';

import './styles.scss';

const b = block('brush');

// - есть chart.zoom который ставит ZoomState
// - есть rangeSlider который ставит ZoomState
// - rangeSlider меняет только ось X
// - chart.zoom может менять обе оси
// - chart.zoom может аффектить зум rangeSlider только по оси X
// - когда сбрасывается chart.zoom то rangeSlider возвращается к своим дефолтам
// - для rangeSlider нужно уметь восстанавливать его состояние после перерисовки осей (когда меняется areas)
// - в один момент времени надо уметь рисовать состояние rangeSlider и показывать правильный chart.zoom

export function useBrush(props: UseBrushProps) {
    const {areas, brushOptions, node, selection, type, onBrushStart, onBrush, onBrushEnd} = props;

    React.useEffect(() => {
        if (!node || !areas.length) {
            return () => {};
        }

        const nodeSelection = select(node);
        const instances: BrushBehavior<unknown>[] = [];
        const groupSelections: Selection<SVGGElement, unknown, null, undefined>[] = [];

        areas.forEach((area) => {
            const brushHeight = area.extent[1][1] - area.extent[0][1];
            const brushWidth = area.extent[1][0] - area.extent[0][0];
            let brushFn: () => BrushBehavior<unknown>;

            switch (type) {
                case 'x': {
                    brushFn = brushX;
                    break;
                }
                case 'y': {
                    brushFn = brushY;
                    break;
                }
                case 'xy':
                default: {
                    brushFn = brush;
                    break;
                }
            }

            const groupSelection = nodeSelection
                .append('g')
                .attr('class', b())
                .on('pointerdown', function () {
                    this.setAttribute('data-gc-brush-pressed', 'true');
                })
                .on('pointerup', function () {
                    this.removeAttribute('data-gc-brush-pressed');
                });

            const instance = brushFn()
                .extent(area.extent)
                .on('start', function (event) {
                    if (brushOptions && brushOptions.borderWidth > 0) {
                        setBrushBorder.call(this, instance, event.selection, {
                            brushOptions,
                            height: brushHeight,
                            width: brushWidth,
                        });
                    }
                    if (brushOptions?.handles?.enabled) {
                        setBrushHandles.call(this, instance, event.selection, {
                            brushOptions,
                            handles: brushOptions.handles,
                            height: brushHeight,
                            width: brushWidth,
                        });
                    }
                    onBrushStart?.call(this, instance);
                    // if (event.sourceEvent) {
                    //     onBrushStart?.call(this, instance);
                    // }
                })
                .on('brush', function (event) {
                    if (brushOptions && brushOptions.borderWidth > 0) {
                        setBrushBorder.call(this, instance, event.selection, {
                            brushOptions,
                            height: brushHeight,
                            width: brushWidth,
                        });
                    }
                    if (brushOptions?.handles?.enabled) {
                        setBrushHandles.call(this, instance, event.selection, {
                            brushOptions,
                            handles: brushOptions.handles,
                            height: brushHeight,
                            width: brushWidth,
                        });
                    }
                    onBrush?.call(this, instance, event.selection);
                    // if (event.sourceEvent) {
                    //     onBrush?.call(this, instance, event.selection);
                    // }
                })
                .on('end', function (event) {
                    if (brushOptions && brushOptions.borderWidth > 0) {
                        setBrushBorder.call(this, instance, event.selection, {
                            brushOptions,
                            height: brushHeight,
                            width: brushWidth,
                        });
                    }
                    if (brushOptions?.handles?.enabled) {
                        setBrushHandles.call(this, instance, event.selection, {
                            brushOptions,
                            handles: brushOptions.handles,
                            height: brushHeight,
                            width: brushWidth,
                        });
                    }
                    onBrushEnd?.call(this, instance, event.selection);
                    // if (event.sourceEvent) {
                    //     onBrushEnd?.call(this, instance, event.selection);
                    // }
                });

            groupSelection.call(instance);

            if (brushOptions) {
                groupSelection
                    .selectAll('.selection')
                    .attr('fill-opacity', brushOptions.style.fillOpacity);
            }

            instances.push(instance);
            groupSelections.push(groupSelection);

            if (selection) {
                groupSelection.call(instance.move, selection);
            }
        });

        return () => {
            instances.forEach((brushInstance) => {
                brushInstance.on('start', null).on('brush', null).on('end', null);
            });
            groupSelections.forEach((groupSelection) => {
                groupSelection?.remove();
            });
        };
    }, [areas, brushOptions, node, selection, type, onBrushStart, onBrush, onBrushEnd]);
}
