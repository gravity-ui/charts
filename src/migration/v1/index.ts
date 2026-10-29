import type {ChartData, ChartInteractionItem, MeaningfulAny} from '../../types';

import {migrateNumberFormatV1} from './number-format';
import {seriesRulesV1} from './series';
import type {
    ChartDataV1,
    FormatNumberOptionsV1,
    MigrationV1Result,
    MigrationV1Warning,
} from './types';

type Path = (string | number)[];
interface Options {
    [key: string]: unknown;
}
interface Patch {
    path: Path;
    value: unknown;
}

function isOptions(value: unknown): value is Options {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function visit(
    value: unknown,
    pattern: readonly string[],
    callback: (value: unknown, path: Path) => void,
    path: Path = [],
) {
    if (!pattern.length) {
        callback(value, path);
        return;
    }
    const [key, ...rest] = pattern;
    if (key === '*') {
        if (Array.isArray(value)) {
            value.forEach((item, index) => visit(item, rest, callback, [...path, index]));
        } else if (isOptions(value)) {
            Object.keys(value).forEach((name) =>
                visit(value[name], rest, callback, [...path, name]),
            );
        }
    } else if (isOptions(value) && Object.prototype.hasOwnProperty.call(value, key)) {
        visit(value[key], rest, callback, [...path, key]);
    }
}

function analyze(data: unknown, collectPatches: boolean) {
    const warnings: MigrationV1Warning[] = [];
    const patches: Patch[] = [];
    const patch = (path: Path, value: unknown) => {
        if (collectPatches) patches.push({path, value});
    };
    const review = (path: Path, code: string, message: string, replacement?: string) => {
        warnings.push({code, path, message, replacement, resolution: 'review'});
    };
    const numberFormat = (value: unknown, path: Path) => {
        if (!isOptions(value) || !Object.prototype.hasOwnProperty.call(value, 'unit')) return;
        const unit = value.unit;
        if (
            unit !== undefined &&
            unit !== null &&
            (typeof unit !== 'string' || !['auto', 'k', 'm', 'b', 't'].includes(unit))
        ) {
            review(
                [...path, 'unit'],
                'invalid-number-unit',
                'Unknown v1 numeric unit; left unchanged.',
            );
            return;
        }
        warnings.push({
            code: 'number-unit',
            path: [...path, 'unit'],
            message: 'unit was removed; use units with the v1 suffixes and an empty delimiter.',
            replacement: 'units',
            resolution: 'automatic',
        });
        patch(path, migrateNumberFormatV1(value as FormatNumberOptionsV1));
    };
    const valueFormat = (value: unknown, path: Path) => {
        if (isOptions(value) && value.type === 'number') numberFormat(value, path);
    };
    const axis = (value: unknown, path: Path) => {
        visit(value, ['labels', 'numberFormat'], numberFormat, path);
        visit(
            value,
            ['ticks'],
            (ticks, ticksPath) => {
                if (
                    !isOptions(ticks) ||
                    !Object.prototype.hasOwnProperty.call(ticks, 'pixelInterval')
                )
                    return;
                const {pixelInterval, ...next} = ticks;
                // v1 uses a truthy interval before falling back to pixelInterval, including interval: 0.
                if (!next.interval) next.interval = pixelInterval;
                warnings.push({
                    code: 'axis-pixel-interval',
                    path: [...ticksPath, 'pixelInterval'],
                    message: 'ticks.pixelInterval was removed; use ticks.interval in pixels.',
                    replacement: 'interval',
                    resolution: 'automatic',
                });
                patch(ticksPath, next);
            },
            path,
        );

        if (!isOptions(value) || !Object.prototype.hasOwnProperty.call(value, 'maxPadding')) return;
        const {maxPadding, ...next} = value;
        if (
            maxPadding !== undefined &&
            (typeof maxPadding !== 'number' || !Number.isFinite(maxPadding * 100) || maxPadding < 0)
        ) {
            review(
                [...path, 'maxPadding'],
                'invalid-axis-max-padding',
                'maxPadding cannot be represented as a finite nonnegative percentage; left unchanged.',
            );
            return;
        }
        const padding = isOptions(value.padding) ? value.padding : {};
        if (padding.max === undefined && maxPadding !== undefined) {
            // Size strings do not accept exponent notation, including for tiny fractions.
            const percentage = (maxPadding * 100).toLocaleString('en-US', {
                useGrouping: false,
                maximumSignificantDigits: 21,
            });
            next.padding = {...padding, max: `${percentage}%`};
        }
        warnings.push({
            code: 'axis-max-padding',
            path: [...path, 'maxPadding'],
            message:
                'maxPadding was removed; use padding.max as a percentage of the original domain.',
            replacement: 'padding.max',
            resolution: 'automatic',
        });
        patch(path, next);
    };
    visit(data, ['xAxis'], axis);
    visit(data, ['yAxis', '*'], axis);
    for (const path of [
        ['tooltip', 'valueFormat'],
        ['tooltip', 'headerFormat'],
        ['tooltip', 'totals', 'valueFormat'],
        ['tooltip', 'rows', '*', 'cells', '*', 'format'],
        ['series', 'options', '*', 'stackLabels', 'format'],
    ])
        visit(data, path, valueFormat);
    visit(data, ['series', 'data', '*'], (series, path) => {
        for (const pattern of [
            ['dataLabels', 'format'],
            ['tooltip', 'valueFormat'],
            ['stackLabels', 'format'],
        ]) {
            visit(series, pattern, valueFormat, path);
        }
        if (!isOptions(series) || typeof series.type !== 'string') return;
        const rules = seriesRulesV1.get(series.type);
        if (rules?.barLabels) {
            visit(
                series,
                ['dataLabels'],
                (labels, labelsPath) => {
                    if (
                        !isOptions(labels) ||
                        !Object.prototype.hasOwnProperty.call(labels, 'inside')
                    )
                        return;
                    const {inside, ...next} = labels;
                    if (inside !== undefined && typeof inside !== 'boolean') {
                        review(
                            [...labelsPath, 'inside'],
                            'invalid-bar-label-inside',
                            'inside must be a boolean; left unchanged.',
                        );
                        return;
                    }
                    if (next.placement === undefined && inside !== undefined) {
                        next.placement =
                            series.stacking === 'percent' || inside
                                ? ['inside-center']
                                : ['outside'];
                    }
                    warnings.push({
                        code: 'bar-label-inside',
                        path: [...labelsPath, 'inside'],
                        message:
                            'inside was removed; use placement. HTML inside labels are now correctly centered.',
                        replacement: 'placement',
                        resolution: 'automatic',
                    });
                    patch(labelsPath, next);
                },
                path,
            );
        }
        for (const field of rules?.reviewFields ?? []) {
            visit(
                series,
                field.path,
                (_, fieldPath) => review(fieldPath, field.code, field.message, field.replacement),
                path,
            );
        }
        for (const pattern of rules?.numberFormats ?? []) visit(series, pattern, valueFormat, path);
    });
    return {warnings, patches};
}

/**
 * Report known removed and deprecated v1 options without changing input or logging.
 * This is not a general configuration validator and does not inspect callback bodies or custom data.
 */
export function inspectChartDataV1(data: unknown): MigrationV1Warning[] {
    return analyze(data, false).warnings;
}

interface PatchTree {
    patch?: Patch;
    children: Map<string | number, PatchTree>;
}

// Clone each changed container once, even when many point-level formats need migration.
function applyPatches(data: unknown, patches: Patch[]) {
    const root: PatchTree = {children: new Map()};
    for (const patch of patches) {
        let node = root;
        for (const key of patch.path) {
            let child = node.children.get(key);
            if (!child) {
                child = {children: new Map()};
                node.children.set(key, child);
            }
            node = child;
        }
        node.patch = patch;
    }
    const apply = (value: unknown, node: PatchTree): unknown => {
        const current = node.patch ? node.patch.value : value;
        if (!node.children.size) return current;
        const result = Array.isArray(current) ? [...current] : {...(current as Options)};
        for (const [key, child] of node.children) {
            (result as Options)[key] = apply((current as Options)[key], child);
        }
        return result;
    };
    return apply(data, root);
}

/**
 * Convert supported v1 aliases without mutating input. Unresolved options and callbacks remain intact.
 * Invoke once per configuration change, outside render loops. Warnings describe the original input.
 */
export function migrateChartDataV1<
    T = MeaningfulAny,
    TItem extends ChartInteractionItem = ChartInteractionItem,
>(data: ChartDataV1<T, TItem>): MigrationV1Result<T, TItem> {
    const {warnings, patches} = analyze(data, true);
    return {data: applyPatches(data, patches) as ChartData<T, TItem>, warnings};
}

export type {ChartDataV1, MigrationV1Warning, MigrationV1Result} from './types';
