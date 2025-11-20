import {path, select} from 'd3';
import type {BrushBehavior} from 'd3';
import round from 'lodash/round';

import type {ChartBrush, DeepRequired} from '../../types';

import type {BrushSelection} from './types';

export function isOneDimensionalSelection(
    selection?: BrushSelection | null,
): selection is [number, number] {
    if (!Array.isArray(selection)) {
        return false;
    }

    if (selection.length !== 2) {
        return false;
    }

    return typeof selection[0] === 'number' && typeof selection[1] === 'number';
}

function getBoundaryFlags(selection: [number, number], width: number) {
    return {
        isLeftBoundary: selection[0] === 0,
        isRightBoundary: round(selection[1], 2) === round(width, 2),
    };
}

export function setBrushBorder(
    this: SVGGElement,
    _brushInstance: BrushBehavior<unknown>,
    selection: BrushSelection | null,
    options: {
        brushOptions: DeepRequired<ChartBrush>;
        height: number;
        width: number;
    },
) {
    const brushGroup = select(this);
    brushGroup.selectAll('.brush-border').remove();

    if (!isOneDimensionalSelection(selection)) {
        return;
    }

    const {brushOptions, height, width} = options;
    const strokeWidth = 1;
    const {isLeftBoundary, isRightBoundary} = getBoundaryFlags(selection, width);
    const selectionLeft: number = isLeftBoundary ? selection[0] : selection[0] - strokeWidth / 2;
    const selectionRight: number = isRightBoundary ? selection[1] : selection[1] + strokeWidth / 2;
    const selectionTop = 0;
    const selectionBottom = height;

    let brushBorderPath: string;

    // If selection is collapsed to a point, draw only a vertical line
    if (selection[0] === selection[1]) {
        const centerX: number = selection[0];
        // Draw a single vertical line in the center
        const p = path();
        p.moveTo(centerX - strokeWidth / 2, selectionTop);
        p.lineTo(centerX + strokeWidth / 2, selectionTop);
        p.lineTo(centerX + strokeWidth / 2, selectionBottom);
        p.lineTo(centerX - strokeWidth / 2, selectionBottom);
        p.closePath();
        brushBorderPath = p.toString();
    } else {
        // Draw full border frame
        const p = path();
        p.moveTo(selectionLeft, selectionTop);
        p.lineTo(selectionRight, selectionTop);
        p.lineTo(selectionRight, selectionBottom);
        p.lineTo(selectionLeft, selectionBottom);
        p.closePath();
        p.moveTo(selectionLeft + strokeWidth, selectionTop + strokeWidth);
        p.lineTo(selectionLeft + strokeWidth, selectionBottom - strokeWidth);
        p.lineTo(selectionRight - strokeWidth, selectionBottom - strokeWidth);
        p.lineTo(selectionRight - strokeWidth, selectionTop + strokeWidth);
        p.closePath();
        brushBorderPath = p.toString();
    }

    brushGroup
        .append('path')
        .attr('class', 'brush-border')
        .attr('d', brushBorderPath)
        .attr('fill', brushOptions.borderColor)
        .attr('fill-rule', 'evenodd')
        .attr('pointer-events', 'none');
}

export function setBrushHandles(
    this: SVGGElement,
    _brushInstance: BrushBehavior<unknown>,
    selection: BrushSelection | null,
    options: {
        brushOptions: DeepRequired<ChartBrush>;
        height: number;
        handles: DeepRequired<ChartBrush>['handles'];
        width: number;
    },
) {
    const brushGroup = select(this);
    brushGroup.selectAll('.handle-decoration').remove();

    if (!isOneDimensionalSelection(selection)) {
        return;
    }

    const {brushOptions, height, width} = options;
    const strokeWidth = 1;
    const {isLeftBoundary, isRightBoundary} = getBoundaryFlags(selection, width);

    const getHandleOffset = (type: 'e' | 'w') => {
        if (type === 'w' && isLeftBoundary) {
            return strokeWidth / 2;
        }
        if (type === 'e' && isRightBoundary) {
            return -strokeWidth / 2;
        }
        return 0;
    };

    brushGroup
        .selectAll<SVGRectElement, {type: 'e' | 'w'}>('.handle')
        .attr('fill', brushOptions.handles.borderColor)
        .attr('height', brushOptions.handles.height)
        .attr('width', brushOptions.handles.width)
        .attr('x', (d) => {
            const offset = getHandleOffset(d.type);
            return selection[d.type === 'w' ? 0 : 1] + offset - brushOptions.handles.width / 2;
        })
        .attr('y', height / 2 - brushOptions.handles.height / 2);

    // Add border and lines for each handle
    brushGroup.selectAll<SVGRectElement, {type: 'e' | 'w'}>('.handle').each(function (d) {
        const offset = getHandleOffset(d.type);
        const handleCenterX: number = selection[d.type === 'w' ? 0 : 1] + offset;
        const handleY = height / 2 - brushOptions.handles.height / 2;
        const handleLeft = handleCenterX - brushOptions.handles.width / 2;
        const handleRight = handleCenterX + brushOptions.handles.width / 2;
        const handleTop = handleY;
        const handleBottom = handleY + brushOptions.handles.height;
        // Vertical padding from top and bottom for inner lines
        const padding = 4;

        // Create a group for all handle decorations
        const handleGroup = brushGroup
            .append('g')
            .attr('class', `handle-decoration handle-decoration--${d.type}`)
            .attr('data-handle-type', d.type);

        // Background rect to cover brush border lines behind the handle
        handleGroup
            .append('rect')
            .attr('class', 'handle-bg')
            .attr('x', handleLeft)
            .attr('y', handleTop)
            .attr('width', brushOptions.handles.width)
            .attr('height', brushOptions.handles.height)
            .attr('fill', 'var(--g-color-base-float)')
            .attr('pointer-events', 'none');

        // Border frame using path with cutout (similar to RangeSlider)
        const borderPathD3 = path();
        borderPathD3.moveTo(handleLeft, handleTop);
        borderPathD3.lineTo(handleRight, handleTop);
        borderPathD3.lineTo(handleRight, handleBottom);
        borderPathD3.lineTo(handleLeft, handleBottom);
        borderPathD3.closePath();
        borderPathD3.moveTo(handleLeft + strokeWidth, handleTop + strokeWidth);
        borderPathD3.lineTo(handleLeft + strokeWidth, handleBottom - strokeWidth);
        borderPathD3.lineTo(handleRight - strokeWidth, handleBottom - strokeWidth);
        borderPathD3.lineTo(handleRight - strokeWidth, handleTop + strokeWidth);
        borderPathD3.closePath();
        const borderPath = borderPathD3.toString();

        handleGroup
            .append('path')
            .attr('class', 'handle-border')
            .attr('d', borderPath)
            .attr('fill', brushOptions.handles.borderColor)
            .attr('fill-rule', 'evenodd')
            .attr('pointer-events', 'none');

        // Two vertical lines (1px from center on each side) as a single path
        const y1 = handleY + padding;
        const y2 = handleY + brushOptions.handles.height - padding;
        const linesPathD3 = path();
        linesPathD3.moveTo(handleCenterX - 1, y1);
        linesPathD3.lineTo(handleCenterX - 1, y2);
        linesPathD3.moveTo(handleCenterX + 1, y1);
        linesPathD3.lineTo(handleCenterX + 1, y2);
        const linesPath = linesPathD3.toString();

        handleGroup
            .append('path')
            .attr('class', 'handle-line')
            .attr('d', linesPath)
            .attr('stroke', brushOptions.handles.borderColor)
            .attr('stroke-width', 1)
            .attr('pointer-events', 'none');
    });
}

export function getNormalizedSelection(args: {selection: BrushSelection; width: number}) {
    const {selection, width} = args;

    if (!isOneDimensionalSelection(selection)) {
        return selection;
    }

    const resultSelection: [number, number] = [...selection];

    if (resultSelection[0] < 0) {
        resultSelection[0] = 0;
    }

    if (resultSelection[1] > width) {
        resultSelection[1] = width;
    }

    return resultSelection;
}
