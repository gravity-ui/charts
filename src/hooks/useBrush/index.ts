import React from 'react';

import {brush, brushX, brushY, select} from 'd3';
import type {BrushBehavior, Selection} from 'd3';

import {block} from '../../utils';

import type {UseBrushProps} from './types';
import {getNormalizedSelection, setBrushBorder, setBrushHandles} from './utils';

import './styles.scss';

const b = block('brush');

export function useBrush(props: UseBrushProps) {
    const {
        areas,
        brushOptions,
        disabled,
        node,
        selection,
        type,
        onBrushStart,
        onBrush,
        onBrushEnd,
    } = props;

    React.useEffect(() => {
        if (!node || !areas.length || disabled) {
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
                    if (event.sourceEvent) {
                        onBrushStart?.call(this, instance, event.selection);
                    }
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
                    if (event.sourceEvent) {
                        onBrush?.call(this, instance, event.selection);
                    }
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
                    if (event.sourceEvent) {
                        onBrushEnd?.call(this, instance, event.selection);
                    }
                });

            groupSelection.call(instance);

            groupSelection.selectAll('.overlay').attr('pointer-events', () => {
                return selection ? 'none' : 'all';
            });

            if (brushOptions) {
                groupSelection
                    .selectAll('.selection')
                    .attr('fill-opacity', brushOptions.style.fillOpacity);
            }

            instances.push(instance);
            groupSelections.push(groupSelection);

            if (selection) {
                groupSelection.call(
                    instance.move,
                    getNormalizedSelection({selection, width: brushWidth}),
                );
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
    }, [areas, brushOptions, disabled, node, selection, type, onBrushStart, onBrush, onBrushEnd]);
}
