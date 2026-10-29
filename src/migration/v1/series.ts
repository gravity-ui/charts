interface SeriesRulesV1 {
    barLabels?: boolean;
    reviewFields?: {
        path: readonly string[];
        code: string;
        message: string;
        replacement?: string;
    }[];
    numberFormats?: readonly (readonly string[])[];
}

const category = {
    path: ['data', '*', 'category'],
    code: 'point-category',
    message:
        'category is deprecated. Use explicit axis coordinates; this adapter leaves raw point fields intact.',
    replacement: 'x / y',
};

// This registry belongs exclusively to the v1 adapter. It never registers or imports chart plugins.
export const seriesRulesV1 = new Map<string, SeriesRulesV1>([
    ['bar-x', {barLabels: true, reviewFields: [category]}],
    ['bar-y', {barLabels: true}],
    ['scatter', {reviewFields: [category], numberFormats: [['cluster', 'dataLabels', 'format']]}],
    ['funnel', {numberFormats: [['data', '*', 'tooltip', 'valueFormat']]}],
]);
