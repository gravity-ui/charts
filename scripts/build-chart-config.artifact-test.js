const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
    createSchemaValidator,
    generateChartConfigArtifacts,
    getExternalDeclarationReferences,
    getInvalidDefaults,
    normalizeSchema,
    removeUnusedDefinitions,
    validateDeclaration,
    validateSchema,
    visitSchema,
    writeChartConfigArtifacts,
} = require('./build-chart-config');

const DECLARATION_PATH = path.resolve(__dirname, 'chart-config.d.ts');

describe('chart config artifacts', () => {
    let declaration;
    let schema;
    let warnSpy;

    beforeAll(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        ({declaration, schema} = generateChartConfigArtifacts());
    });

    afterAll(() => {
        warnSpy.mockRestore();
    });

    test('generates a standalone declaration bundle', () => {
        expect(getExternalDeclarationReferences(DECLARATION_PATH, declaration)).toEqual([]);
        expect(declaration).toContain('export interface ChartConfig');
        // Guards against accidental inlining of a large dependency. Update if the type surface
        // legitimately grows past this limit.
        expect(Buffer.byteLength(declaration)).toBeLessThan(150_000);
    });

    test('standalone declarations support both legend layouts', () => {
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'chart-config-usage.ts'),
                declaration +
                    `
                    const legend: ChartLegend = {position: 'left', layout: 'vertical'};
                    legend.layout = 'horizontal';
                    // @ts-expect-error Only horizontal and vertical layouts are supported.
                    legend.layout = 'columns';
                `,
            ),
        ).not.toThrow();
    });

    test('schema exposes legend layout values and the compatible default', () => {
        expect(schema.definitions.ChartLegend.properties.layout).toMatchObject({
            enum: ['horizontal', 'vertical'],
            default: 'horizontal',
        });
        const validateConfig = createSchemaValidator().compile(schema);
        for (const layout of [undefined, 'horizontal', 'vertical']) {
            expect(validateConfig({series: {data: []}, legend: {layout}})).toBe(true);
        }
        expect(validateConfig({series: {data: []}, legend: {layout: 'columns'}})).toBe(false);
    });

    test('schema supports pixel and percentage legend widths', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        for (const width of [0, 0.5, 230, '0px', '.5px', '230px', '0%', '12.5%', '150%']) {
            expect(validateConfig({series: {data: []}, legend: {width}})).toBe(true);
        }
        for (const width of [-10, -0.5, NaN, Infinity, -Infinity, true]) {
            expect(validateConfig({series: {data: []}, legend: {width}})).toBe(false);
        }
    });

    test('schema accepts the supported legend item click actions', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        for (const itemClickAction of ['default', 'none']) {
            expect(validateConfig({series: {data: []}, legend: {itemClickAction}})).toBe(true);
        }
        expect(validateConfig({series: {data: []}, legend: {itemClickAction: 'toggle'}})).toBe(
            false,
        );
    });

    test('standalone declarations preserve series compatibility, formatters and legend widths', () => {
        const usage = `
            const legend: ChartLegend = {width: 230};
            legend.width = '12.5%';
            legend.width = '230px';
            legend.width = '.5px';
            legend.itemClickAction = 'none';
            // String formats are checked at runtime and fall back to automatic sizing.
            legend.width = '230em';
            legend.width = '230';
            // @ts-expect-error Booleans are not supported.
            legend.width = true;
            const pieFormat: PieValueFormat = {
                type: 'custom',
                formatter: ({percentage, name, value}) => percentage?.toFixed(2) ?? name ?? String(value),
            };
            const pie: PieSeries = {type: 'pie', data: [], dataLabels: {format: pieFormat}};
            const shared: ValueFormat = pieFormat;
            const line: LineSeries = {type: 'line', name: 'L', data: [], dataLabels: {format: shared}};
            function applyDefaults<T extends BaseSeries>(series: T): T { return series; }
            applyDefaults(pie);
            applyDefaults(line);
            const plainPie: PieSeries = {type: 'pie', data: []};
            const area: AreaSeries = {type: 'area', name: 'A', data: []};
            const barX: BarXSeries = {type: 'bar-x', name: 'A', data: []};
            const barY: BarYSeries = {type: 'bar-y', name: 'A', data: []};
            [plainPie, area, barX, barY].forEach(series => applyDefaults(series));
            const strictFormat: ValueFormat<{value: unknown; percentage: number}> = {
                type: 'custom', formatter: ({percentage}) => percentage.toFixed(2),
            };
            // @ts-expect-error A value-only formatter cannot require percentage.
            const unsafe: ValueFormat = strictFormat;
            line.dataLabels = {format: unsafe};
            // @ts-expect-error Series contexts allow percentage to be absent.
            pie.dataLabels = {format: strictFormat};
            const legacy: ValueFormat = {type: 'custom', formatter: ({value}) => String(value)};
            pie.dataLabels = {format: legacy};
        `;
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'chart-config-usage.ts'),
                declaration + usage,
            ),
        ).not.toThrow();
    });

    test('standalone declarations expose stack labels only on supported series and plugin options', () => {
        const usage = `
            const labels: StackLabelsOptions = {
                enabled: true, padding: 8, allowOverlap: false, style: {fontSize: '12px'},
                format: {type: 'custom', formatter: ({value}) => String(value)},
            };
            const options: ChartSeriesOptions = {
                'bar-x': {stackLabels: labels}, 'bar-y': {stackLabels: labels},
                area: {stackLabels: labels},
            };
            const area: AreaSeries = {type: 'area', name: 'A', data: [], stackLabels: labels};
            const barX: BarXSeries = {type: 'bar-x', name: 'X', data: [], stackLabels: labels};
            const barY: BarYSeries = {type: 'bar-y', name: 'Y', data: [], stackLabels: labels};
            // @ts-expect-error Line series do not support stack labels.
            const line: LineSeries = {type: 'line', name: 'L', data: [], stackLabels: labels};
            // @ts-expect-error Stack labels are not supported by all series.
            const series: BaseSeries = {stackLabels: labels};
            // @ts-expect-error Point data labels do not contain stack settings.
            const pointLabels: BaseDataLabels = {stackLabels: labels};
            // @ts-expect-error Line does not support stack labels.
            options.line = {stackLabels: labels};
            void [area, barX, barY, line, series, pointLabels];
        `;
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'chart-config-usage.ts'),
                declaration + usage,
            ),
        ).not.toThrow();
    });

    test.each(['bar-x', 'bar-y', 'area'])('schema supports stack labels for %s', (type) => {
        const validateConfig = createSchemaValidator().compile(schema);
        const config = {
            series: {
                data: [
                    {
                        type,
                        name: 'A',
                        stacking: 'normal',
                        data: [{x: 0, y: 1}],
                        stackLabels: {
                            enabled: true,
                            style: {fontSize: '14px'},
                            padding: 6,
                            allowOverlap: true,
                            format: {type: 'number', precision: 1},
                        },
                    },
                ],
                options: {
                    [type]: {
                        stackLabels: {
                            enabled: true,
                            padding: 8,
                            allowOverlap: false,
                            style: {fontSize: '12px'},
                            format: {type: 'number', precision: 2},
                        },
                    },
                },
            },
        };
        expect(validateConfig(config)).toBe(true);
        config.series.data[0].stackLabels.enabled = 'yes';
        expect(validateConfig(config)).toBe(false);
        config.series.data[0].stackLabels.enabled = true;
        config.series.options[type].stackLabels.enabled = 'yes';
        expect(validateConfig(config)).toBe(false);
    });

    test('schema rejects stack labels on unsupported plugins and series', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        const series = {type: 'line', name: 'A', data: [{x: 0, y: 1}]};
        expect(
            validateConfig({
                series: {data: [series], options: {line: {stackLabels: {enabled: true}}}},
            }),
        ).toBe(false);
        expect(validateConfig({series: {data: [{...series, stackLabels: {enabled: true}}]}})).toBe(
            false,
        );
    });

    test('area-range marker options are exposed in the standalone declaration and schema', () => {
        const options = {
            marker: {enabled: true, radius: 5, symbol: 'square', color: '#ff0000'},
            states: {
                hover: {
                    marker: {
                        enabled: true,
                        borderWidth: 2,
                    },
                },
            },
        };
        const range = {
            type: 'area-range',
            name: 'Range',
            marker: options.marker,
            data: [
                {x: 0, y0: 1, y1: 2, marker: {color: '#00ff00', states: {normal: {enabled: true}}}},
            ],
        };
        const config = {series: {options: {'area-range': options}, data: [range]}};
        expect(createSchemaValidator().compile(schema)(config)).toBe(true);
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'area-range-marker-usage.ts'),
                declaration + `\nexport const config: ChartConfig = ${JSON.stringify(config)};`,
            ),
        ).not.toThrow();
    });

    test('validates declaration content without accessing the published file', () => {
        // DECLARATION_PATH (scripts/chart-config.d.ts) never exists on disk; validateDeclaration
        // uses it only as a virtual filename for the TypeScript compiler host.
        expect(() =>
            validateDeclaration(
                DECLARATION_PATH,
                'export interface BrokenDeclaration { value: MissingType; }',
            ),
        ).toThrow(/MissingType|TS2304/);
    });

    test.each([
        "import type {External} from 'external';",
        "export {External} from 'external';",
        "type External = import('external').External;",
        "type External = typeof import('external');",
        '/// <reference types="external" />',
        '/// <reference path="external.d.ts" />',
        '/// <reference lib="esnext" />',
        "import External = require('external');",
    ])('detects an external declaration dependency: %s', (externalDeclaration) => {
        expect(getExternalDeclarationReferences(DECLARATION_PATH, externalDeclaration)).not.toEqual(
            [],
        );
    });

    test.each([
        ["type External = import('external').External;", 'external'],
        ["type External = typeof import('external');", 'external'],
        ["import External = require('external');", 'external'],
    ])('reports an unquoted module name for %s', (externalDeclaration, moduleName) => {
        expect(getExternalDeclarationReferences(DECLARATION_PATH, externalDeclaration)).toEqual([
            moduleName,
        ]);
    });

    test('rejects a required callback-only property instead of weakening the schema', () => {
        const callbackSchema = {
            $ref: '#/definitions/Root',
            definitions: {
                Root: {
                    type: 'object',
                    properties: {renderer: {type: 'null'}},
                    required: ['renderer'],
                    additionalProperties: false,
                },
            },
        };

        expect(() => normalizeSchema(callbackSchema)).toThrow(
            /required callback-only property "renderer"/,
        );
    });

    test('removes unreachable definitions', () => {
        const definitionSchema = {
            $ref: '#/definitions/Root',
            definitions: {
                Root: {$ref: '#/definitions/Reachable'},
                Reachable: {type: 'string'},
                Unreachable: {type: 'number'},
            },
        };

        removeUnusedDefinitions(definitionSchema);

        expect(Object.keys(definitionSchema.definitions)).toEqual(['Root', 'Reachable']);
    });

    test('removes an invalid default from a nested definition', () => {
        const defaultSchema = {
            $ref: '#/definitions/Root',
            definitions: {
                Root: {
                    type: 'object',
                    properties: {nested: {$ref: '#/definitions/Nested'}},
                },
                Nested: {type: 'number', default: 'not-a-number'},
            },
        };

        normalizeSchema(defaultSchema);

        expect(defaultSchema.definitions.Nested).not.toHaveProperty('default');
    });

    test('warns about every stripped invalid default with a JSON-pointer path', () => {
        const defaultSchema = {
            type: 'object',
            properties: {
                width: {type: 'number', default: '1px'},
                label: {type: 'string', enum: ['a', 'b'], default: 'undefined'},
            },
        };

        warnSpy.mockClear();
        normalizeSchema(defaultSchema);

        const warnings = warnSpy.mock.calls.map(([message]) => message);
        expect(warnings).toEqual(
            expect.arrayContaining([
                expect.stringMatching(
                    /stripping invalid @default at #\/properties\/width: "1px" \(must be number\)/,
                ),
                expect.stringMatching(
                    /stripping invalid @default at #\/properties\/label: "undefined" \(/,
                ),
            ]),
        );
    });

    test('reports invalid defaults with a JSON-pointer path to the offending node', () => {
        const defaultSchema = {
            type: 'object',
            properties: {
                inner: {type: 'object', properties: {flag: {type: 'boolean', default: 'nope'}}},
            },
        };

        expect(getInvalidDefaults(defaultSchema)).toEqual([
            expect.objectContaining({
                path: '#/properties/inner/properties/flag',
                value: 'nope',
            }),
        ]);
    });

    test('reports every invalid default while sharing root definitions', () => {
        const validDefault = {type: 'number', default: 1};
        const firstInvalidDefault = {$ref: '#/definitions/Number', default: 'invalid'};
        const secondInvalidDefault = {type: 'boolean', default: 0};
        const defaultSchema = {
            definitions: {
                Number: {type: 'number'},
            },
            properties: {
                valid: validDefault,
                firstInvalid: firstInvalidDefault,
                secondInvalid: secondInvalidDefault,
            },
        };

        expect(getInvalidDefaults(defaultSchema)).toEqual([
            expect.objectContaining({schema: firstInvalidDefault, value: 'invalid'}),
            expect.objectContaining({schema: secondInvalidDefault, value: 0}),
        ]);
    });

    test('visits shared and cyclic schema nodes once', () => {
        const sharedSchema = {type: 'string'};
        const cyclicSchema = {properties: {first: sharedSchema, second: sharedSchema}};
        cyclicSchema.not = cyclicSchema;
        const visitedSchemas = [];

        visitSchema(cyclicSchema, (schemaNode) => visitedSchemas.push(schemaNode));

        expect(visitedSchemas).toEqual([cyclicSchema, sharedSchema]);
    });

    test('normalizes shared and cyclic schema nodes once', () => {
        const callbackSchema = {type: 'null'};
        const cyclicSchema = {
            type: 'object',
            properties: {first: callbackSchema, second: callbackSchema},
        };
        cyclicSchema.not = cyclicSchema;

        normalizeSchema(cyclicSchema);

        expect(cyclicSchema.properties).toEqual({});
    });

    test('writes generated artifacts', () => {
        const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'chart-config-'));
        const declarationPath = path.join(outputDirectory, 'chart-config.d.ts');
        const schemaPath = path.join(outputDirectory, 'chart-config.schema.json');

        try {
            writeChartConfigArtifacts({declaration, schema}, {declarationPath, schemaPath});

            expect(fs.readFileSync(declarationPath, 'utf8')).toBe(declaration);
            expect(JSON.parse(fs.readFileSync(schemaPath, 'utf8'))).toEqual(schema);
        } finally {
            fs.rmSync(outputDirectory, {recursive: true});
        }
    });

    test.each([
        [
            'a missing top-level ChartConfig reference',
            (invalidSchema) => delete invalidSchema.$ref,
            /must have top-level \$ref/,
        ],
        [
            'a missing ChartConfig definition',
            (invalidSchema) => delete invalidSchema.definitions.ChartConfig,
            /must contain a "ChartConfig" root definition/,
        ],
        [
            'series not being required',
            (invalidSchema) => {
                invalidSchema.definitions.ChartConfig.required = [];
            },
            /must require "series"/,
        ],
        [
            'a callback-only property',
            (invalidSchema) => {
                invalidSchema.definitions.ChartConfig.properties.callback = {type: 'null'};
            },
            /contains a callback-only property/,
        ],
        [
            'an unsafe definition reference',
            (invalidSchema) => {
                invalidSchema.definitions.ChartConfig.properties.invalid = {
                    $ref: '#/definitions/Invalid<Type',
                };
            },
            /contains an invalid \$ref/,
        ],
    ])('rejects %s', (_testCase, mutateSchema, expectedError) => {
        const invalidSchema = structuredClone(schema);
        mutateSchema(invalidSchema);

        expect(() => validateSchema(invalidSchema)).toThrow(expectedError);
    });

    test('validates the generated schema', () => {
        expect(() => validateSchema(schema)).not.toThrow();
        expect(getInvalidDefaults(schema)).toEqual([]);
    });

    test.each([
        [
            'minimal line series',
            {series: {data: [{type: 'line', name: 'S', data: [{x: 0, y: 1}]}]}},
        ],
        [
            'minimal bar-x series',
            {series: {data: [{type: 'bar-x', name: 'S', data: [{x: 'Jan', y: 10}]}]}},
        ],
        ['minimal pie series', {series: {data: [{type: 'pie', data: [{value: 1, name: 'A'}]}]}}],
        [
            'minimal area series',
            {series: {data: [{type: 'area', name: 'S', data: [{x: 0, y: 1}]}]}},
        ],
        [
            'line with gradient',
            {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'S',
                            color: {
                                type: 'linear-gradient',
                                angle: 90,
                                stops: [
                                    {offset: 0, color: '#fff'},
                                    {offset: 1, color: '#000'},
                                ],
                            },
                            data: [{x: 0, y: 1}],
                        },
                    ],
                },
            },
        ],
        [
            'area with independent line and fill colors',
            {
                series: {
                    data: [
                        {
                            type: 'area',
                            name: 'S',
                            color: '#000',
                            fillColor: {
                                type: 'linear-gradient',
                                stops: [
                                    {offset: 0, color: '#fff'},
                                    {offset: 1, color: '#000'},
                                ],
                            },
                            data: [{x: 0, y: 1}],
                        },
                    ],
                },
            },
        ],
        [
            'line with xAxis and yAxis',
            {
                series: {data: [{type: 'line', name: 'S', data: [{x: 0, y: 1}]}]},
                xAxis: {title: {text: 'Time'}},
                yAxis: [{title: {text: 'Value'}}],
            },
        ],
        [
            'line with tooltip',
            {
                series: {data: [{type: 'line', name: 'S', data: [{x: 0, y: 1}]}]},
                tooltip: {enabled: true},
            },
        ],
        [
            'line with split',
            {
                series: {data: [{type: 'line', name: 'S', data: [{x: 0, y: 1}]}]},
                split: {enable: true},
            },
        ],
        [
            'line with cardinal interpolation',
            {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'S',
                            data: [{x: 0, y: 1}],
                            interpolation: {type: 'cardinal', tension: 0.5},
                        },
                    ],
                },
            },
        ],
        [
            'two series',
            {
                series: {
                    data: [
                        {type: 'line', name: 'A', data: [{x: 0, y: 1}]},
                        {type: 'area', name: 'B', data: [{x: 0, y: 2}]},
                    ],
                },
            },
        ],
    ])('accepts a valid config: %s', (_label, config) => {
        const validateConfig = createSchemaValidator().compile(schema);
        expect(validateConfig(config)).toBe(true);
    });

    test.each([-0.1, 1.1])('rejects cardinal tension outside the 0–1 range: %s', (tension) => {
        const validateConfig = createSchemaValidator().compile(schema);
        const config = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'S',
                        data: [{x: 0, y: 1}],
                        interpolation: {type: 'cardinal', tension},
                    },
                ],
            },
        };

        expect(validateConfig(config)).toBe(false);
    });

    test('rejects a gradient with fewer than two stops', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        const config = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'S',
                        color: {
                            type: 'linear-gradient',
                            stops: [{offset: 0, color: '#fff'}],
                        },
                        data: [{x: 0, y: 1}],
                    },
                ],
            },
        };

        expect(validateConfig(config)).toBe(false);
    });

    test('schema definitions and properties match the committed snapshot', () => {
        const snapshotPath = path.resolve(
            __dirname,
            '__snapshots__/chart-config.schema.summary.json',
        );
        const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        const defs = schema.definitions || {};

        const actual = {
            definitions: Object.keys(defs).sort(),
            properties: Object.fromEntries(
                Object.entries(defs)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, def]) => [name, Object.keys(def.properties || {}).sort()])
                    .filter(([, props]) => props.length > 0),
            ),
        };

        expect(actual).toEqual(snapshot);
    });

    test('omits callback-only properties', () => {
        const callbackProperties = [];
        const callbackPropertyNames = new Set(['events', 'formatter', 'renderer', 'rowRenderer']);
        visitSchema(schema, (schemaNode) => {
            for (const propertyName of Object.keys(schemaNode.properties || {})) {
                if (callbackPropertyNames.has(propertyName)) {
                    callbackProperties.push(propertyName);
                }
            }
        });
        expect(callbackProperties).toEqual([]);
    });

    test('rejects function-only custom value formats', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        expect(
            validateConfig({
                series: {data: []},
                tooltip: {valueFormat: {type: 'custom'}},
            }),
        ).toBe(false);
    });

    test('rejects unknown nested properties', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        expect(validateConfig({series: {data: [], unknownProperty: true}})).toBe(false);
    });

    test('does not contain unsafe definition references', () => {
        expect(JSON.stringify(schema)).not.toMatch(/#\/definitions\/[^"%]*[<>]/);
    });
});
