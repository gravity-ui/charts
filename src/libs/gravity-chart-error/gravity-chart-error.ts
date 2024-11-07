export type GravityChartErrorArgs = {
    code?: number | string;
    originalError?: Error;
    message?: string;
};

export const GRAVITY_CHART_ERROR_CODE = {
    NO_DATA: 'NO_DATA',
    INVALID_DATA: 'INVALID_DATA',
    UNKNOWN: 'UNKNOWN_ERROR',
};

export class GravityChartError extends Error {
    readonly code: number | string;
    readonly isGravityChartError = true;

    constructor({
        originalError,
        message,
        code = GRAVITY_CHART_ERROR_CODE.UNKNOWN,
    }: GravityChartErrorArgs = {}) {
        super(message);

        this.code = code;

        if (originalError) {
            this.name = originalError.name;
            this.stack = originalError.stack;
        }
    }
}

export const isGravityChartError = (error: unknown): error is GravityChartError => {
    return error instanceof Error && 'isGravityChartError' in error;
};
