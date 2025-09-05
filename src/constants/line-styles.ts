export const DASH_STYLE = {
    Dash: 'Dash',
    DashDot: 'DashDot',
    Dot: 'Dot',
    LongDash: 'LongDash',
    LongDashDot: 'LongDashDot',
    LongDashDotDot: 'LongDashDotDot',
    ShortDash: 'ShortDash',
    ShortDashDot: 'ShortDashDot',
    ShortDashDotDot: 'ShortDashDotDot',
    ShortDot: 'ShortDot',
    Solid: 'Solid',
} as const;

export type DashStyle = keyof typeof DASH_STYLE;

export enum LineCap {
    Butt = 'butt',
    Round = 'round',
    Square = 'square',
    None = 'none',
}
