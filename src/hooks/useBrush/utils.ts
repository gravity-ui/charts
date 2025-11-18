import {select} from 'd3';
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
        brushBorderPath = `
                M ${centerX - strokeWidth / 2} ${selectionTop}
                L ${centerX + strokeWidth / 2} ${selectionTop}
                L ${centerX + strokeWidth / 2} ${selectionBottom}
                L ${centerX - strokeWidth / 2} ${selectionBottom}
                Z
            `.replace(/[\n\s]{2,}/g, ' ');
    } else {
        // Draw full border frame
        brushBorderPath = `
                M ${selectionLeft} ${selectionTop}
                L ${selectionRight} ${selectionTop}
                L ${selectionRight} ${selectionBottom}
                L ${selectionLeft} ${selectionBottom}
                Z
                M ${selectionLeft + strokeWidth} ${selectionTop + strokeWidth}
                L ${selectionLeft + strokeWidth} ${selectionBottom - strokeWidth}
                L ${selectionRight - strokeWidth} ${selectionBottom - strokeWidth}
                L ${selectionRight - strokeWidth} ${selectionTop + strokeWidth}
                Z
            `.replace(/[\n\s]{2,}/g, ' ');
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
        const borderPath = `
            M ${handleLeft} ${handleTop}
            L ${handleRight} ${handleTop}
            L ${handleRight} ${handleBottom}
            L ${handleLeft} ${handleBottom}
            Z
            M ${handleLeft + strokeWidth} ${handleTop + strokeWidth}
            L ${handleLeft + strokeWidth} ${handleBottom - strokeWidth}
            L ${handleRight - strokeWidth} ${handleBottom - strokeWidth}
            L ${handleRight - strokeWidth} ${handleTop + strokeWidth}
            Z
        `.replace(/[\n\s]{2,}/g, ' ');

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
        const linesPath = `
            M ${handleCenterX - 1} ${y1}
            L ${handleCenterX - 1} ${y2}
            M ${handleCenterX + 1} ${y1}
            L ${handleCenterX + 1} ${y2}
        `.replace(/[\n\s]{2,}/g, ' ');

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
