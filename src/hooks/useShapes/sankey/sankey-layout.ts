// Derived from d3-sankey v0.12.3 (https://github.com/d3/d3-sankey)
// Copyright 2015-2021 Mike Bostock — ISC License
//
// Changes:
// - Ported to TypeScript with explicit generic types (SankeyComputedNode, SankeyComputedLink)
// - sankeyLinkHorizontal() implemented via linkHorizontal() from d3-shape
// - Removed unused alignment helpers (left, right, center); only justify is kept
// - No d3-sankey dependency; uses d3-array and d3-shape (already project dependencies)

import {max, min, sum} from 'd3-array';
import {linkHorizontal} from 'd3-shape';

type SankeyLayoutNodeProps = {
    index: number;
    depth: number;
    height: number;
    layer: number;
    value: number;
    fixedValue?: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
};

type SankeyLayoutLinkProps = {
    index: number;
    value: number;
    width: number;
    y0: number;
    y1: number;
};

export type SankeyComputedNode<N, L> = N &
    SankeyLayoutNodeProps & {
        sourceLinks: SankeyComputedLink<N, L>[];
        targetLinks: SankeyComputedLink<N, L>[];
    };

export type SankeyComputedLink<N, L> = L &
    SankeyLayoutLinkProps & {
        source: SankeyComputedNode<N, L>;
        target: SankeyComputedNode<N, L>;
    };

export type SankeyGraph<N, L> = {
    nodes: SankeyComputedNode<N, L>[];
    links: SankeyComputedLink<N, L>[];
};

type AlignFn<N, L> = (node: SankeyComputedNode<N, L>, n: number) => number;
type SortFn<T> = (a: T, b: T) => number;

type UnresolvedLink<N, L> = Omit<SankeyComputedLink<N, L>, 'source' | 'target'> & {
    source: SankeyComputedNode<N, L> | string | number;
    target: SankeyComputedNode<N, L> | string | number;
};

function justify<N, L>(node: SankeyComputedNode<N, L>, n: number): number {
    return node.sourceLinks.length ? node.depth : n - 1;
}

function ascendingBreadth<N, L>(a: SankeyComputedNode<N, L>, b: SankeyComputedNode<N, L>) {
    return a.y0 - b.y0;
}

function ascendingSourceBreadth<N, L>(a: SankeyComputedLink<N, L>, b: SankeyComputedLink<N, L>) {
    return ascendingBreadth(a.source, b.source) || a.index - b.index;
}

function ascendingTargetBreadth<N, L>(a: SankeyComputedLink<N, L>, b: SankeyComputedLink<N, L>) {
    return ascendingBreadth(a.target, b.target) || a.index - b.index;
}

function nodeValue<N, L>(d: SankeyComputedNode<N, L>) {
    return d.value;
}

function linkValue<N, L>(d: SankeyComputedLink<N, L>) {
    return d.value;
}

export function sankey<N, L>() {
    let x0 = 0,
        y0 = 0,
        x1 = 1,
        y1 = 1;
    let dx = 24; // nodeWidth
    let dy = 8,
        py: number; // nodePadding
    let getId: (d: N, i: number) => string | number = (_d, i) => i;
    let align: AlignFn<N, L> = justify;
    let sort: SortFn<SankeyComputedNode<N, L>> | undefined;
    let linkSort: SortFn<SankeyComputedLink<N, L>> | undefined;
    let iterations = 6;

    function generator(input: {nodes: N[]; links: L[]}): SankeyGraph<N, L> {
        // Mutate input in-place (same as original d3-sankey): layout props are added
        // directly to node/link objects so that source/target references stay consistent.
        const graph = {
            nodes: input.nodes as unknown as SankeyComputedNode<N, L>[],
            links: input.links as unknown as SankeyComputedLink<N, L>[],
        };
        computeNodeLinks(graph);
        computeNodeValues(graph);
        computeNodeDepths(graph);
        computeNodeHeights(graph);
        computeNodeBreadths(graph);
        computeLinkBreadths(graph);
        return graph;
    }

    generator.nodeId = function (fn: (d: N, i: number) => string | number) {
        getId = fn;
        return generator;
    };

    generator.nodeAlign = function (fn: AlignFn<N, L>) {
        align = fn;
        return generator;
    };

    generator.nodeSort = function (fn: SortFn<SankeyComputedNode<N, L>> | undefined) {
        sort = fn;
        return generator;
    };

    generator.nodeWidth = function (value: number) {
        dx = value;
        return generator;
    };

    generator.nodePadding = function (value: number) {
        dy = py = value;
        return generator;
    };

    generator.linkSort = function (fn: SortFn<SankeyComputedLink<N, L>> | undefined) {
        linkSort = fn;
        return generator;
    };

    generator.extent = function ([[left, top], [right, bottom]]: [
        [number, number],
        [number, number],
    ]) {
        x0 = left;
        y0 = top;
        x1 = right;
        y1 = bottom;
        return generator;
    };

    generator.iterations = function (value: number) {
        iterations = value;
        return generator;
    };

    function computeNodeLinks(graph: SankeyGraph<N, L>) {
        for (const [i, node] of graph.nodes.entries()) {
            node.index = i;
            node.sourceLinks = [];
            node.targetLinks = [];
        }
        const nodeById = new Map(graph.nodes.map((d, i) => [getId(d as unknown as N, i), d]));
        for (const [i, link] of graph.links.entries()) {
            link.index = i;
            const unresolved = link as unknown as UnresolvedLink<N, L>;
            if (typeof unresolved.source !== 'object') {
                unresolved.source = findNode(nodeById, unresolved.source as string | number);
            }
            if (typeof unresolved.target !== 'object') {
                unresolved.target = findNode(nodeById, unresolved.target as string | number);
            }
            link.source.sourceLinks.push(link);
            link.target.targetLinks.push(link);
        }
        if (linkSort !== null && linkSort !== undefined) {
            for (const {sourceLinks, targetLinks} of graph.nodes) {
                sourceLinks.sort(linkSort);
                targetLinks.sort(linkSort);
            }
        }
    }

    function computeNodeValues(graph: SankeyGraph<N, L>) {
        for (const node of graph.nodes) {
            node.value =
                node.fixedValue === undefined
                    ? Math.max(sum(node.sourceLinks, linkValue), sum(node.targetLinks, linkValue))
                    : node.fixedValue;
        }
    }

    function computeNodeDepths(graph: SankeyGraph<N, L>) {
        const n = graph.nodes.length;
        let current = new Set(graph.nodes);
        let next = new Set<SankeyComputedNode<N, L>>();
        let x = 0;
        while (current.size) {
            for (const node of current) {
                node.depth = x;
                for (const {target} of node.sourceLinks) {
                    next.add(target);
                }
            }
            if (++x > n) throw new Error('circular link');
            current = next;
            next = new Set();
        }
    }

    function computeNodeHeights(graph: SankeyGraph<N, L>) {
        const n = graph.nodes.length;
        let current = new Set(graph.nodes);
        let next = new Set<SankeyComputedNode<N, L>>();
        let x = 0;
        while (current.size) {
            for (const node of current) {
                node.height = x;
                for (const {source} of node.targetLinks) {
                    next.add(source);
                }
            }
            if (++x > n) throw new Error('circular link');
            current = next;
            next = new Set();
        }
    }

    function computeNodeLayers(graph: SankeyGraph<N, L>): SankeyComputedNode<N, L>[][] {
        const x = (max(graph.nodes, (d) => d.depth) ?? 0) + 1;
        const kx = (x1 - x0 - dx) / (x - 1);
        const columns: SankeyComputedNode<N, L>[][] = new Array(x);
        for (const node of graph.nodes) {
            const i = Math.max(0, Math.min(x - 1, Math.floor(align(node, x))));
            node.layer = i;
            node.x0 = x0 + i * kx;
            node.x1 = node.x0 + dx;
            if (columns[i]) columns[i].push(node);
            else columns[i] = [node];
        }
        if (sort) {
            for (const column of columns) {
                column.sort(sort);
            }
        }
        return columns;
    }

    function initializeNodeBreadths(columns: SankeyComputedNode<N, L>[][]) {
        const ky = min(columns, (c) => (y1 - y0 - (c.length - 1) * py) / sum(c, nodeValue)) ?? 0;
        for (const nodes of columns) {
            let y = y0;
            for (const node of nodes) {
                node.y0 = y;
                node.y1 = y + node.value * ky;
                y = node.y1 + py;
                for (const link of node.sourceLinks) {
                    link.width = link.value * ky;
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

    function computeNodeBreadths(graph: SankeyGraph<N, L>) {
        const columns = computeNodeLayers(graph);
        py = Math.min(dy, (y1 - y0) / ((max(columns, (c) => c.length) ?? 1) - 1));
        initializeNodeBreadths(columns);
        for (let i = 0; i < iterations; ++i) {
            const alpha = Math.pow(0.99, i);
            const beta = Math.max(1 - alpha, (i + 1) / iterations);
            relaxRightToLeft(columns, alpha, beta);
            relaxLeftToRight(columns, alpha, beta);
        }
    }

    function computeLinkBreadths(graph: SankeyGraph<N, L>) {
        for (const node of graph.nodes) {
            let ly0 = node.y0;
            let ly1 = ly0;
            for (const link of node.sourceLinks) {
                link.y0 = ly0 + link.width / 2;
                ly0 += link.width;
            }
            for (const link of node.targetLinks) {
                link.y1 = ly1 + link.width / 2;
                ly1 += link.width;
            }
        }
    }

    function relaxLeftToRight(columns: SankeyComputedNode<N, L>[][], alpha: number, beta: number) {
        for (let i = 1, n = columns.length; i < n; ++i) {
            const column = columns[i];
            for (const target of column) {
                let y = 0;
                let w = 0;
                for (const {source, value} of target.targetLinks) {
                    const v = value * (target.layer - source.layer);
                    y += targetTop(source, target) * v;
                    w += v;
                }
                if (!(w > 0)) continue;
                const d = (y / w - target.y0) * alpha;
                target.y0 += d;
                target.y1 += d;
                reorderNodeLinks(target);
            }
            if (sort === undefined) column.sort(ascendingBreadth);
            resolveCollisions(column, beta);
        }
    }

    function relaxRightToLeft(columns: SankeyComputedNode<N, L>[][], alpha: number, beta: number) {
        for (let n = columns.length, i = n - 2; i >= 0; --i) {
            const column = columns[i];
            for (const source of column) {
                let y = 0;
                let w = 0;
                for (const {target, value} of source.sourceLinks) {
                    const v = value * (target.layer - source.layer);
                    y += sourceTop(source, target) * v;
                    w += v;
                }
                if (!(w > 0)) continue;
                const d = (y / w - source.y0) * alpha;
                source.y0 += d;
                source.y1 += d;
                reorderNodeLinks(source);
            }
            if (sort === undefined) column.sort(ascendingBreadth);
            resolveCollisions(column, beta);
        }
    }

    function resolveCollisions(nodes: SankeyComputedNode<N, L>[], alpha: number) {
        const i = Math.floor(nodes.length / 2);
        const subject = nodes[i];
        resolveCollisionsBottomToTop(nodes, subject.y0 - py, i - 1, alpha);
        resolveCollisionsTopToBottom(nodes, subject.y1 + py, i + 1, alpha);
        resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha);
        resolveCollisionsTopToBottom(nodes, y0, 0, alpha);
    }

    function resolveCollisionsTopToBottom(
        nodes: SankeyComputedNode<N, L>[],
        y: number,
        i: number,
        alpha: number,
    ) {
        for (; i < nodes.length; ++i) {
            const node = nodes[i];
            const d = (y - node.y0) * alpha;
            if (d > 1e-6) {
                node.y0 += d;
                node.y1 += d;
            }
            y = node.y1 + py;
        }
    }

    function resolveCollisionsBottomToTop(
        nodes: SankeyComputedNode<N, L>[],
        y: number,
        i: number,
        alpha: number,
    ) {
        for (; i >= 0; --i) {
            const node = nodes[i];
            const d = (node.y1 - y) * alpha;
            if (d > 1e-6) {
                node.y0 -= d;
                node.y1 -= d;
            }
            y = node.y0 - py;
        }
    }

    function reorderNodeLinks(node: SankeyComputedNode<N, L>) {
        if (linkSort === undefined) {
            for (const {
                source: {sourceLinks},
            } of node.targetLinks) {
                sourceLinks.sort(ascendingTargetBreadth);
            }
            for (const {
                target: {targetLinks},
            } of node.sourceLinks) {
                targetLinks.sort(ascendingSourceBreadth);
            }
        }
    }

    function reorderLinks(nodes: SankeyComputedNode<N, L>[]) {
        if (linkSort === undefined) {
            for (const {sourceLinks, targetLinks} of nodes) {
                sourceLinks.sort(ascendingTargetBreadth);
                targetLinks.sort(ascendingSourceBreadth);
            }
        }
    }

    function targetTop(source: SankeyComputedNode<N, L>, target: SankeyComputedNode<N, L>): number {
        let y = source.y0 - ((source.sourceLinks.length - 1) * py) / 2;
        for (const {target: node, width} of source.sourceLinks) {
            if (node === target) break;
            y += width + py;
        }
        for (const {source: node, width} of target.targetLinks) {
            if (node === source) break;
            y -= width;
        }
        return y;
    }

    function sourceTop(source: SankeyComputedNode<N, L>, target: SankeyComputedNode<N, L>): number {
        let y = target.y0 - ((target.targetLinks.length - 1) * py) / 2;
        for (const {source: node, width} of target.targetLinks) {
            if (node === source) break;
            y += width + py;
        }
        for (const {target: node, width} of source.sourceLinks) {
            if (node === target) break;
            y -= width;
        }
        return y;
    }

    return generator;
}

export function sankeyLinkHorizontal<N, L>() {
    return linkHorizontal<SankeyComputedLink<N, L>, [number, number]>()
        .source((d) => [d.source.x1, d.y0])
        .target((d) => [d.target.x0, d.y1]);
}

function findNode<N, L>(
    nodeById: Map<string | number, SankeyComputedNode<N, L>>,
    id: string | number,
): SankeyComputedNode<N, L> {
    const node = nodeById.get(id);
    if (!node) throw new Error('missing: ' + id);
    return node;
}
