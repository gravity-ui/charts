export const SERIES_TYPE = {
    Area: 'area',
    BarX: 'bar-x',
    BarY: 'bar-y',
    Line: 'line',
    Pie: 'pie',
    Scatter: 'scatter',
    Treemap: 'treemap',
    Waterfall: 'waterfall',
    Sankey: 'sankey',
    Radar: 'radar',
    Heatmap: 'heatmap',
} as const;

export type SeriesType = (typeof SERIES_TYPE)[keyof typeof SERIES_TYPE];
