import type {PreparedSankeyData, SankeyLink, SankeyNode} from '~core/shapes/sankey/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {InteractionElementsArgs} from '~core/utils/chart-interaction';
import type {NearestCandidate, PrepareNearestDataArgs} from '~core/utils/nearest-point';

import type {ChartSankeyLinkPoint, PointPosition} from '../../types';

const linkPoints = new WeakMap<SankeyLink, ChartSankeyLinkPoint>();

export function getTargetElements({plot, preparedData}: InteractionElementsArgs) {
    const {series} = preparedData[0] as PreparedSankeyData;
    return [
        ...getInteractionElements<SankeyNode>(plot, 'rect', (node) => ({point: node.data, series})),
        ...getInteractionElements<SankeyLink>(plot, 'path', (link) => {
            const point = getLinkPoint(link);
            return {point, series};
        }),
    ];
}

function getLinkPoint(link: SankeyLink): ChartSankeyLinkPoint {
    let point = linkPoints.get(link);
    if (!point) {
        point = {kind: 'link', source: link.source, target: link.target, value: link.value};
        linkPoints.set(link, point);
    }
    return point;
}

const linkPositions = new WeakMap<SankeyLink, PointPosition>();

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedSankeyData>): NearestCandidate[] {
    const shape = data[0];
    if (!shape) return [];
    const candidates: NearestCandidate[] = shape.nodes.map((node) => ({
        position: [(node.x0 + node.x1) / 2, (node.y0 + node.y1) / 2],
        item: {point: node.data, series: shape.series},
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
