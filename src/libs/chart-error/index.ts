export type ChartErrorArgs = {
    code?: number | string;
    originalError?: Error;
    message?: string;
};

export const CHART_ERROR_CODE = {
    NO_DATA: 'ERR.CK.NO_DATA',
    INVALID_DATA: 'ERR.CK.INVALID_DATA',
    UNKNOWN: 'ERR.CK.UNKNOWN_ERROR',
};

export class ChartError extends Error {
    readonly code: number | string;
    readonly isCustomError = true;

    constructor({originalError, message, code = CHART_ERROR_CODE.UNKNOWN}: ChartErrorArgs = {}) {
        super(message);

        this.code = code;

        if (originalError) {
            this.name = originalError.name;
            this.stack = originalError.stack;
        }
    }
}

export const isCustomError = (error: unknown): error is ChartError => {
    return error instanceof Error && 'isCustomError' in error;
};
