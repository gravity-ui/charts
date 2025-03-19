export * from './defaults';
export * from './misc';

export const SeriesType = {
    Area: 'area',
    BarX: 'bar-x',
    BarY: 'bar-y',
    Line: 'line',
    Pie: 'pie',
    Scatter: 'scatter',
    Treemap: 'treemap',
    Waterfall: 'waterfall',
    Sankey: 'sankey',
} as const;

export enum DashStyle {
    Dash = 'Dash',
    DashDot = 'DashDot',
    Dot = 'Dot',
    LongDash = 'LongDash',
    LongDashDot = 'LongDashDot',
    LongDashDotDot = 'LongDashDotDot',
    ShortDash = 'ShortDash',
    ShortDashDot = 'ShortDashDot',
    ShortDashDotDot = 'ShortDashDotDot',
    ShortDot = 'ShortDot',
    Solid = 'Solid',
}

export enum SymbolType {
    Circle = 'circle',
    Diamond = 'diamond',
    Square = 'square',
    Triangle = 'triangle',
    TriangleDown = 'triangle-down',
}

export enum LineCap {
    Butt = 'butt',
    Round = 'round',
    Square = 'square',
    None = 'none',
}

export enum LayoutAlgorithm {
    Binary = 'binary',
    Dice = 'dice',
    Slice = 'slice',
    SliceDice = 'slice-dice',
    Squarify = 'squarify',
}

export const DEFAULT_PALETTE = [
    '#4DA2F1',
    '#FF3D64',
    '#8AD554',
    '#FFC636',
    '#FFB9DD',
    '#84D1EE',
    '#FF91A1',
    '#54A520',
    '#DB9100',
    '#BA74B3',
    '#1F68A9',
    '#ED65A9',
    '#0FA08D',
    '#FF7E00',
    '#E8B0A4',
    '#52A6C5',
    '#BE2443',
    '#70C1AF',
    '#FFB46C',
    '#DCA3D7',
];

export const DEFAULT_AXIS_LABEL_FONT_SIZE = '11px';
