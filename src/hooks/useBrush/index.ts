import React from 'react';

import {brush, brushX, brushY, select} from 'd3';
import type {BrushBehavior, Selection} from 'd3';

import {block} from '../../utils';

import type {UseBrushProps} from './types';

import './styles.scss';

const b = block('brush');

export function useBrush(props: UseBrushProps) {
    const {areas, brushOptions, node, type, onBrushStart, onBrush, onBrushEnd} = props;

    React.useEffect(() => {
        if (!node || !areas.length) {
            return () => {};
        }

        const brushes: BrushBehavior<unknown>[] = [];
        const brushGroupSelections: Selection<SVGGElement, unknown, null, undefined>[] = [];
        const nodeSelection = select(node);

        areas.forEach((area) => {
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

            const brushInstance = brushFn()
                .extent(area.extent)
                .on('start', function () {
                    onBrushStart?.call(this, brushInstance);
                })
                .on('brush', function (event) {
                    onBrush?.call(this, brushInstance, event.selection);
                })
                .on('end', function (event) {
                    onBrushEnd?.call(this, brushInstance, event.selection);
                });

            brushes.push(brushInstance);

            const brushGroupSelection = nodeSelection
                .append('g')
                .attr('class', b())
                .on('pointerdown', function () {
                    this.setAttribute('data-gc-brush-pressed', 'true');
                })
                .on('pointerup', function () {
                    this.removeAttribute('data-gc-brush-pressed');
                });
            brushGroupSelection.call(brushInstance);
            brushGroupSelection
                .selectAll('.selection')
                .attr('fill', brushOptions.style.fill)
                .attr('fill-opacity', brushOptions.style.fillOpacity);

            brushGroupSelections.push(brushGroupSelection);
        });

        return () => {
            brushes.forEach((brushInstance) => {
                brushInstance.on('start', null).on('brush', null).on('end', null);
            });
            brushGroupSelections.forEach((selection) => {
                selection?.remove();
            });
        };
    }, [areas, brushOptions, node, type, onBrushStart, onBrush, onBrushEnd]);
}
