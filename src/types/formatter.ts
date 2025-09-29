export interface FormatOptions {
    precision?: number | 'auto';
    showRankDelimiter?: boolean;
    lang?: string;
    labelMode?: string;
}

export interface FormatNumberOptions extends FormatOptions {
    format?: 'number' | 'percent';
    multiplier?: number;
    prefix?: string;
    postfix?: string;
    unit?: 'auto' | 'k' | 'm' | 'b' | 't' | null;
}
