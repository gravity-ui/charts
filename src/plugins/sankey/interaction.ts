import type {PreparedSankeyData, SankeyLink, SankeyNode} from '~core/shapes/sankey/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElement, InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';
import {getSourcePoint} from '~core/utils/source-point';

import type {PointPosition} from '../../types';

import type {SankeyInteractionItem, SankeyLinkPoint} from './interaction-types';

const linkPoints = new WeakMap<SankeyLink, SankeyLinkPoint>();

export function getTargetElements({
    plot,
    preparedData,
}: InteractionElementsArgs): InteractionElement<SankeyInteractionItem>[] {
    const shape = preparedData[0] as PreparedSankeyData | undefined;
    if (!shape) return [];
    const {series} = shape;
    return [
        ...getInteractionElements<SankeyNode, SankeyInteractionItem>(plot, 'rect', (node) => ({
            point: getSourcePoint(node.data),
            series,
        })),
        ...getInteractionElements<SankeyLink, SankeyInteractionItem>(plot, 'path', (link) => {
            const point = getLinkPoint(link);
            return {point, series};
        }),
    ];
}

function getLinkPoint(link: SankeyLink): SankeyLinkPoint {
    let point = linkPoints.get(link);
    if (!point) {
        point = {
            kind: 'link',
            source: getSourcePoint(link.source),
            target: getSourcePoint(link.target),
            value: link.value,
        };
        linkPoints.set(link, point);
    }
    return point;
}

const linkPositions = new WeakMap<SankeyLink, PointPosition>();

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedSankeyData>): NearestCandidate<SankeyInteractionItem>[] {
    const shape = data[0];
    if (!shape) return [];
    const candidates: NearestCandidate<SankeyInteractionItem>[] = shape.nodes.map((node) => ({
        position: [(node.x0 + node.x1) / 2, (node.y0 + node.y1) / 2],
        item: {point: getSourcePoint(node.data), series: shape.series},
    }));
    // Prepared links are replaced on geometry updates. Measure each path only once.
    let path: SVGPathElement | undefined;
    for (const link of shape.links) {
        if (!link.path || link.strokeWidth <= 0) continue;
        let position = linkPositions.get(link);
        if (!position) {
            path ??= document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', link.path);
            const midpoint = path.getPointAtLength(path.getTotalLength() / 2);
            position = [midpoint.x, midpoint.y];
            linkPositions.set(link, position);
        }
        candidates.push({position, item: {point: getLinkPoint(link), series: shape.series}});
    }
    return candidates;
}
