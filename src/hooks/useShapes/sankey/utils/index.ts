import {max, min, sum} from 'd3';

interface SankeyNodeMinimal {
    name?: string;
}

interface SankeyLinkMinimal {
    source: string | number | SankeyNodeMinimal;
    target: string | number | SankeyNodeMinimal;
    value?: number;
}

export interface SankeyNode<N extends SankeyNodeMinimal> extends SankeyNodeMinimal {
    sourceLinks?: Array<SankeyLink<N>>;
    targetLinks?: Array<SankeyLink<N>>;
    x0?: number;
    y0?: number;
    x1?: number;
    y1?: number;
    index?: number;
    depth?: number;
    height?: number;
    layer?: number;
    value?: number;
    fixedValue?: number;
    width?: number;
}

interface SankeyLink<N extends SankeyNodeMinimal> extends SankeyLinkMinimal {
    source: N;
    target: N;
    y0?: number;
    y1?: number;
    width?: number;
    value?: number;
    index?: number;
}

interface SankeyGraph<N extends SankeyNodeMinimal, L extends SankeyLinkMinimal> {
    nodes: Array<N>;
    links: Array<L>;
}

interface SankeyLayout<N extends SankeyNodeMinimal, L extends SankeyLinkMinimal> {
    (graph: SankeyGraph<N, L>): SankeyGraph<N, L>;
    nodeId(id: (node: N, i: number, nodes: Array<N>) => string): this;
    nodeSort(sort: ((a: SankeyNode<N>, b: SankeyNode<N>) => number) | null | undefined): this;
    nodeWidth(width: number): this;
    nodePadding(padding: number): this;
    extent(extent: [[number, number], [number, number]]): this;
}

function constant<T>(x: T): () => T {
    return function (): T {
        return x;
    };
}

function justify<N extends SankeyNodeMinimal>(node: SankeyNode<N>, n: number): number {
    return node.sourceLinks!.length ? node.depth! : n - 1;
}

function ascendingSourceBreadth<N extends SankeyNodeMinimal>(
    a: SankeyLink<N>,
    b: SankeyLink<N>,
): number {
    return ascendingBreadth(a.source, b.source) || a.index! - b.index!;
}

function ascendingTargetBreadth<N extends SankeyNodeMinimal>(
    a: SankeyLink<N>,
    b: SankeyLink<N>,
): number {
    return ascendingBreadth(a.target, b.target) || a.index! - b.index!;
}

function ascendingBreadth<N extends SankeyNodeMinimal>(a: SankeyNode<N>, b: SankeyNode<N>): number {
    return a.y0! - b.y0!;
}

function value<N extends SankeyNodeMinimal>(d: SankeyLink<N>): number {
    return d.value!;
}

function defaultId<N extends SankeyNodeMinimal>(d: N): string {
    return d.index!.toString();
}

function find<N extends SankeyNodeMinimal>(nodeById: Map<string, N>, id: string | number): N {
    const node = nodeById.get(id.toString());
    if (!node) throw new Error('missing: ' + id);
    return node;
}

function computeLinkBreadths<N extends SankeyNodeMinimal>({
    nodes,
}: {
    nodes: Array<SankeyNode<N>>;
}): void {
    for (const node of nodes) {
        let y0 = node.y0!;
        let y1 = y0;
        for (const link of node.sourceLinks!) {
            link.y0 = y0 + link.width! / 2;
            y0 += link.width!;
        }
        for (const link of node.targetLinks!) {
            link.y1 = y1 + link.width! / 2;
            y1 += link.width!;
        }
    }
}

export default function Sankey<
    N extends SankeyNodeMinimal,
    L extends SankeyLinkMinimal,
>(): SankeyLayout<N, L> {
    let x0 = 0,
        y0 = 0,
        x1 = 1,
        y1 = 1; // extent
    let dx = 24; // nodeWidth
    let dy = 8,
        py: number; // nodePadding
    let id: (d: N, i: number, nodes: Array<N>) => string = defaultId;
    const align: (node: SankeyNode<N>, n: number) => number = justify;
    let sort: ((a: SankeyNode<N>, b: SankeyNode<N>) => number) | null | undefined;
    let linkSort: ((a: SankeyLink<N>, b: SankeyLink<N>) => number) | null | undefined;
    const iterations = 6;

    function sankey(graph: SankeyGraph<N, L>): SankeyGraph<N, L> {
        computeNodeLinks(graph);
        computeNodeValues(graph);
        computeNodeDepths(graph);
        computeNodeHeights(graph);
        computeNodeBreadths(graph);
        computeLinkBreadths(graph);
        return graph;
    }

    sankey.nodeId = function (_?: ((d: N, i: number, nodes: Array<N>) => string) | string) {
        if (arguments.length) {
            id = typeof _ === 'function' ? _ : constant(_);
            return sankey;
        }
        return id;
    };

    sankey.nodeSort = function (
        _?: ((a: SankeyNode<N>, b: SankeyNode<N>) => number) | null | undefined,
    ) {
        if (arguments.length) {
            sort = _;
            return sankey;
        }
        return sort;
    };

    sankey.nodeWidth = function (_?: number) {
        if (arguments.length) {
            dx = Number(_);
            return sankey;
        }
        return dx;
    };

    sankey.nodePadding = function (_?: number) {
        if (arguments.length) {
            dy = py = Number(_);
            return sankey;
        }
        return dy;
    };

    sankey.extent = function (_?: [[number, number], [number, number]]): any {
        if (arguments.length) {
            x0 = Number(_![0][0]);
            x1 = Number(_![1][0]);
            y0 = Number(_![0][1]);
            y1 = Number(_![1][1]);
            return sankey;
        }
        return [
            [x0, y0],
            [x1, y1],
        ];
    };

    function computeNodeLinks({nodes, links}: {nodes: Array<N>; links: Array<L>}): void {
        for (const [i, node] of nodes.entries()) {
            (node as SankeyNode<N>).index = i;
            (node as SankeyNode<N>).sourceLinks = [];
            (node as SankeyNode<N>).targetLinks = [];
        }
        const nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d]));
        for (const [i, link] of links.entries()) {
            (link as SankeyLink<N>).index = i;
            let {source, target} = link;
            if (typeof source !== 'object') source = (link as any).source = find(nodeById, source);
            if (typeof target !== 'object') target = (link as any).target = find(nodeById, target);
            (source as SankeyNode<N>).sourceLinks!.push(link as any);
            (target as SankeyNode<N>).targetLinks!.push(link as any);
        }
        if (linkSort !== null) {
            for (const {sourceLinks, targetLinks} of nodes as unknown as Array<SankeyNode<N>>) {
                sourceLinks!.sort(linkSort);
                targetLinks!.sort(linkSort);
            }
        }
    }

    function computeNodeValues({nodes}: {nodes: Array<SankeyNode<N>>}): void {
        for (const node of nodes) {
            node.value =
                node.fixedValue === undefined
                    ? Math.max(sum(node.sourceLinks!, value), sum(node.targetLinks!, value))
                    : node.fixedValue;
        }
    }

    function computeNodeDepths({nodes}: {nodes: Array<SankeyNode<N>>}): void {
        const n = nodes.length;
        let current = new Set(nodes);
        let next = new Set<SankeyNode<N>>();
        let x = 0;
        while (current.size) {
            for (const node of current) {
                node.depth = x;
                for (const {target} of node.sourceLinks!) {
                    next.add(target);
                }
            }
            if (++x > n) throw new Error('circular link');
            current = next;
            next = new Set();
        }
    }

    function computeNodeHeights({nodes}: {nodes: Array<SankeyNode<N>>}): void {
        const n = nodes.length;
        let current = new Set(nodes);
        let next = new Set<SankeyNode<N>>();
        let x = 0;
        while (current.size) {
            for (const node of current) {
                node.height = x;
                for (const {source} of node.targetLinks!) {
                    next.add(source);
                }
            }
            if (++x > n) throw new Error('circular link');
            current = next;
            next = new Set();
        }
    }

    function computeNodeLayers({
        nodes,
    }: {
        nodes: Array<SankeyNode<N>>;
    }): Array<Array<SankeyNode<N>>> {
        const x = max(nodes, (d) => d.depth!)! + 1;
        const kx = (x1 - x0 - dx) / (x - 1);
        const columns = new Array<Array<SankeyNode<N>>>(x);
        for (const node of nodes) {
            const i = Math.max(0, Math.min(x - 1, Math.floor(align(node, x))));
            node.layer = i;
            node.x0 = x0 + i * kx;
            node.x1 = node.x0 + dx;
            if (columns[i]) columns[i].push(node);
            else columns[i] = [node];
        }
        if (sort)
            for (const column of columns) {
                column.sort(sort);
            }
        return columns;
    }

    function initializeNodeBreadths(columns: Array<Array<SankeyNode<N>>>): void {
        const ky = min(columns, (c) => (y1 - y0 - (c.length - 1) * py) / sum(c, value))!;
        for (const nodes of columns) {
            let y = y0;
            for (const node of nodes) {
                node.y0 = y;
                node.y1 = y + node.value! * ky;
                y = node.y1 + py;
                for (const link of node.sourceLinks!) {
                    link.width = link.value! * ky;
                }
            }
            y = (y1 - y + py) / (nodes.length + 1);
            for (let i = 0; i < nodes.length; ++i) {
                const node = nodes[i];
                node.y0 += y * (i + 1);
                node.y1 += y * (i + 1);
            }
            reorderLinks(nodes);
        }
    }

    function computeNodeBreadths(graph: {nodes: Array<SankeyNode<N>>}): void {
        const columns = computeNodeLayers(graph);
        py = Math.min(dy, (y1 - y0) / (max(columns, (c) => c.length)! - 1));
        initializeNodeBreadths(columns);
        for (let i = 0; i < iterations; ++i) {
            const alpha = Math.pow(0.99, i);
            const beta = Math.max(1 - alpha, (i + 1) / iterations);
            relaxRightToLeft(columns, alpha, beta);
            relaxLeftToRight(columns, alpha, beta);
        }
    }

    // Reposition each node based on its incoming (target) links.
    function relaxLeftToRight(
        columns: Array<Array<SankeyNode<N>>>,
        alpha: number,
        beta: number,
    ): void {
        for (let i = 1, n = columns.length; i < n; ++i) {
            const column = columns[i];
            for (const target of column) {
                let y = 0;
                let w = 0;
                for (const {source, value} of target.targetLinks!) {
                    const v = value! * (target.layer! - source.layer!);
                    y += targetTop(source, target) * v;
                    w += v;
                }
                if (!(w > 0)) continue;
                const dy = (y / w - target.y0!) * alpha;
                target.y0! += dy;
                target.y1! += dy;
                reorderNodeLinks(target);
            }
            if (sort === undefined) column.sort(ascendingBreadth);
            resolveCollisions(column, beta);
        }
    }

    // Reposition each node based on its outgoing (source) links.
    function relaxRightToLeft(
        columns: Array<Array<SankeyNode<N>>>,
        alpha: number,
        beta: number,
    ): void {
        for (let n = columns.length, i = n - 2; i >= 0; --i) {
            const column = columns[i];
            for (const source of column) {
                let y = 0;
                let w = 0;
                for (const {target, value} of source.sourceLinks!) {
                    const v = value! * (target.layer! - source.layer!);
                    y += sourceTop(source, target) * v;
                    w += v;
                }
                if (!(w > 0)) continue;
                const dy = (y / w - source.y0!) * alpha;
                source.y0! += dy;
                source.y1! += dy;
                reorderNodeLinks(source);
            }
            if (sort === undefined) column.sort(ascendingBreadth);
            resolveCollisions(column, beta);
        }
    }

    function resolveCollisions(nodes: Array<SankeyNode<N>>, alpha: number): void {
        // eslint-disable-next-line no-bitwise
        const i = nodes.length >> 1;
        const subject = nodes[i];
        resolveCollisionsBottomToTop(nodes, subject.y0! - py, i - 1, alpha);
        resolveCollisionsTopToBottom(nodes, subject.y1! + py, i + 1, alpha);
        resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha);
        resolveCollisionsTopToBottom(nodes, y0, 0, alpha);
    }

    // Push any overlapping nodes down.
    function resolveCollisionsTopToBottom(
        nodes: Array<SankeyNode<N>>,
        y: number,
        i: number,
        alpha: number,
    ): void {
        for (; i < nodes.length; ++i) {
            const node = nodes[i];
            const dy = (y - node.y0!) * alpha;
            if (dy > 1e-6) {
                node.y0! += dy;
                node.y1! += dy;
            }
            y = node.y1! + py;
        }
    }

    // Push any overlapping nodes up.
    function resolveCollisionsBottomToTop(
        nodes: Array<SankeyNode<N>>,
        y: number,
        i: number,
        alpha: number,
    ): void {
        for (; i >= 0; --i) {
            const node = nodes[i];
            const dy = (node.y1! - y) * alpha;
            if (dy > 1e-6) {
                node.y0! -= dy;
                node.y1! -= dy;
            }
            y = node.y0! - py;
        }
    }

    function reorderNodeLinks({sourceLinks, targetLinks}: SankeyNode<N>): void {
        if (linkSort === undefined) {
            for (const {
                source: {sourceLinks},
            } of targetLinks!) {
                sourceLinks!.sort(ascendingTargetBreadth);
            }
            for (const {
                target: {targetLinks},
            } of sourceLinks!) {
                targetLinks!.sort(ascendingSourceBreadth);
            }
        }
    }

    function reorderLinks(nodes: Array<SankeyNode<N>>): void {
        if (linkSort === undefined) {
            for (const {sourceLinks, targetLinks} of nodes) {
                sourceLinks!.sort(ascendingTargetBreadth);
                targetLinks!.sort(ascendingSourceBreadth);
            }
        }
    }

    // Returns the target.y0 that would produce an ideal link from source to target.
    function targetTop(source: SankeyNode<N>, target: SankeyNode<N>): number {
        let y = source.y0! - ((source.sourceLinks!.length - 1) * py) / 2;
        for (const {target: node, width} of source.sourceLinks!) {
            if (node === target) break;
            y += width! + py;
        }
        for (const {source: node, width} of target.targetLinks!) {
            if (node === source) break;
            y -= width!;
        }
        return y;
    }

    // Returns the source.y0 that would produce an ideal link from source to target.
    function sourceTop(source: SankeyNode<N>, target: SankeyNode<N>): number {
        let y = target.y0! - ((target.targetLinks!.length - 1) * py) / 2;
        for (const {source: node, width} of target.targetLinks!) {
            if (node === source) break;
            y += width! + py;
        }
        for (const {target: node, width} of source.sourceLinks!) {
            if (node === target) break;
            y -= width!;
        }
        return y;
    }

    return sankey;
}
