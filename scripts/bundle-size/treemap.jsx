// Module treemap of one build with drill-down: a click on a tile opens it, the breadcrumbs go back.
import React from 'react';

import {Chart} from '@gravity-ui/charts';

const PALETTE = [
    '#4c7bd9',
    '#e8743b',
    '#3aa76d',
    '#d6a400',
    '#9b59b6',
    '#20a8c4',
    '#e0557f',
    '#6c7ae0',
    '#a0522d',
    '#7f8c8d',
];
const OTHER_COLOR = '#bbbbbb';
const TOP_TILES = 48;
const TOP_GROUPS = 24;
const TOP_CHILDREN = 12;
const kBFormat = {type: 'number', precision: 2, postfix: ' kB', lang: 'en'};
const formatKB = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;

// The biggest children, with the rest folded into one "other" tile (index -1).
function topChildren(node, limit) {
    const children = (node.children ?? []).map((child, index) => ({child, index}));
    if (children.length <= limit) return children;
    const rest = children.slice(limit);
    const size = rest.reduce((sum, {child}) => sum + child.size, 0);
    return [
        ...children.slice(0, limit),
        {child: {name: `other (${rest.length})`, size}, index: -1},
    ];
}

const colorOf = (index, i) => (index === -1 ? OTHER_COLOR : PALETTE[i % PALETTE.length]);

// One level: every tile is labelled with its name and size.
function flatPoints(node, path) {
    return topChildren(node, TOP_TILES).map(({child, index}, i) => ({
        name: [child.name, formatKB(child.size)],
        value: child.size,
        color: colorOf(index, i),
        custom: {path: index === -1 ? null : [...path, index]},
    }));
}

// Two levels. The charts treemap labels only leaves, so groups are told apart by color.
function nestedPoints(node, path) {
    const points = [];
    topChildren(node, TOP_GROUPS).forEach(({child, index}, i) => {
        const color = colorOf(index, i);
        const childPath = index === -1 ? null : [...path, index];
        const grandchildren = child.children ? topChildren(child, TOP_CHILDREN) : [];
        if (grandchildren.length < 2) {
            points.push({name: child.name, value: child.size, color, custom: {path: childPath}});
            return;
        }
        const id = `group-${i}`;
        points.push({id, name: child.name, color, custom: {path: childPath}});
        for (const {child: grandchild, index: grandIndex} of grandchildren) {
            points.push({
                name: grandchild.name,
                parentId: id,
                value: grandchild.size,
                color,
                custom: {path: grandIndex === -1 ? childPath : [...childPath, grandIndex]},
            });
        }
    });
    return points;
}

export function Treemap({tree}) {
    const [path, setPath] = React.useState([]);
    const [nested, setNested] = React.useState(false);
    const nodes = path.reduce(
        (list, index) => [...list, list[list.length - 1].children[index]],
        [tree],
    );
    const node = nodes[nodes.length - 1];

    // A tile without children opens its parent group instead.
    const open = React.useCallback(
        (target) => {
            const resolved = target.reduce((n, index) => n.children[index], tree);
            setPath(resolved.children ? target : target.slice(0, -1));
        },
        [tree],
    );
    const data = React.useMemo(
        () => ({
            legend: {enabled: false},
            tooltip: {valueFormat: kBFormat},
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: node.name,
                        layoutAlgorithm: 'squarify',
                        levels: [{index: 1, padding: 6}],
                        data: nested ? nestedPoints(node, path) : flatPoints(node, path),
                    },
                ],
            },
            chart: {
                events: {
                    click: ({targets}) => {
                        const target = targets?.[0]?.point.custom?.path;
                        if (target) open(target);
                    },
                },
            },
        }),
        [node, path, nested, open],
    );

    return (
        <div>
            <nav className="crumbs">
                {nodes.map((n, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="sep">›</span>}
                        <button
                            type="button"
                            disabled={i === nodes.length - 1}
                            onClick={() => setPath(path.slice(0, i))}
                        >
                            {n.name}
                        </button>
                    </React.Fragment>
                ))}
                <span className="size">
                    {formatKB(node.size)} · {((node.size / tree.size) * 100).toFixed(1)}% of the
                    build
                </span>
                <label className="nested">
                    <input
                        type="checkbox"
                        checked={nested}
                        onChange={(event) => setNested(event.target.checked)}
                    />{' '}
                    nested
                </label>
            </nav>
            <div className="treemap">
                <Chart data={data} lang="en" />
            </div>
        </div>
    );
}
