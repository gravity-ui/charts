export type ChartErrorArgs = {
    code?: number | string;
    originalError?: Error;
    message?: string;
};

export const CHART_ERROR_CODE = {
    NO_DATA: 'NO_DATA',
    INVALID_DATA: 'INVALID_DATA',
    UNKNOWN: 'UNKNOWN_ERROR',
};

export class ChartError extends Error {
    readonly code: number | string;
    readonly isChartError = true;

    constructor({originalError, message, code = CHART_ERROR_CODE.UNKNOWN}: ChartErrorArgs = {}) {
        super(message);

        this.code = code;

        if (originalError) {
            this.name = originalError.name;
            this.stack = originalError.stack;
        }
    }
}

export const isChartError = (error: unknown): error is ChartError => {
    return error instanceof Error && 'isChartError' in error;
};
