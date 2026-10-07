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

    test('tooltip callbacks expose Y axes and the axis index of Cartesian series', () => {
        const usage = `
            const tooltip: ChartTooltip = {
                renderer: ({hovered, yAxis, yAxes}) => {
                    hovered.forEach(item => {
                        const index = 'yAxis' in item.series ? item.series.yAxis ?? 0 : 0;
                        const axis: ChartYAxis | undefined = yAxes?.[index] ?? yAxis;
                        void axis;
                    });
                    return null;
                },
                rows: [{renderer: (args) => {
                    const record: Record<string, unknown> = args;
                    void record;
                    void args.yAxes?.[1];
                    return '';
                }}],
                totals: {aggregation: ({yAxes}) => yAxes?.length},
            };
            void tooltip;
        `;
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'tooltip-config-usage.ts'),
                declaration + usage,
            ),
        ).not.toThrow();
        // Callback arguments are TypeScript-only and must not become chart config fields.
        expect(schema.definitions['ChartTooltip<JsonValue>'].properties).not.toHaveProperty(
            'yAxes',
        );
    });

    test('standalone declarations support automatic legend width and size limits', () => {
        const usage = `
            const autoLegend: ChartLegend = {position: 'left', width: 'auto', maxWidth: '30.5%'};
            const fixedLegend: ChartLegend = {width: 230, maxWidth: 100};
            const continuousLegend: ChartLegend = {type: 'continuous', maxWidth: '120px'};
            // @ts-expect-error A maximum width must be a number or string.
            const invalidLegend: ChartLegend = {maxWidth: true};
            void [autoLegend, fixedLegend, continuousLegend, invalidLegend];
        `;
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'chart-config-usage.ts'),
                declaration + usage,
            ),
        ).not.toThrow();
    });

    test('schema supports automatic legend width and numeric or string limits', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        for (const maxWidth of [230, '230px', '30.5%']) {
            expect(
                validateConfig({
                    series: {data: []},
                    legend: {position: 'left', width: 'auto', maxWidth},
                }),
            ).toBe(true);
        }
        expect(validateConfig({series: {data: []}, legend: {maxWidth: true}})).toBe(false);
        expect(validateConfig({series: {data: []}, legend: {maxWidth: -10}})).toBe(false);
        expect(validateConfig({series: {data: []}, legend: {maxWidth: 0}})).toBe(true);
        // String formats are resolved at runtime, as with other dimension options.
        expect(validateConfig({series: {data: []}, legend: {width: 'invalid'}})).toBe(true);
    });

    test('documents every series type', () => {
        const series = schema.definitions['ChartSeries<JsonValue>'].anyOf;
        const descriptions = new Map(
            series.map((entry) => {
                const definition =
                    schema.definitions[decodeURIComponent(entry.$ref.split('/').pop())];
                const {type} = definition.properties;

                expect(type.const).toEqual(expect.any(String));
                expect(type.description).toEqual(expect.any(String));
                expect(type.description.length).toBeGreaterThan(0);

                return [type.const, type.description];
            }),
        );

        expect(descriptions.size).toBe(series.length);
        expect([...descriptions.values()].every((description) => description.length > 0)).toBe(
            true,
        );
    });

    test('describes every documented enum without changing validation', () => {
        let documentedChoices = 0;

        visitSchema(schema, (node) => {
            if (!Array.isArray(node.enum) || typeof node.description !== 'string') {
                return;
            }

            if (!/^- `(?:'[^']+'|null)`/m.test(node.description)) {
                return;
            }

            documentedChoices++;
            expect(node.enumDescriptions).toHaveLength(node.enum.length);
            for (const [index, value] of node.enum.entries()) {
                if (typeof value === 'string' || value === null) {
                    expect(node.enumDescriptions[index].trim().length).toBeGreaterThan(0);
                }
            }
            expect(node).not.toHaveProperty('oneOf');
        });

        expect(documentedChoices).toBeGreaterThan(0);
        for (const choice of [
            schema.definitions.ZoomType,
            schema.definitions.PlotBandAlign,
            schema.definitions['FunnelSeries<JsonValue>'].properties.dataLabels.properties.anchor,
            schema.definitions.ChartZoom.properties.resetButton.properties.relativeTo,
        ]) {
            expect(choice.enumDescriptions).toHaveLength(choice.enum.length);
        }

        const validateChoice = createSchemaValidator().compile(schema.definitions.ChartAxisType);
        for (const value of schema.definitions.ChartAxisType.enum) {
            expect(validateChoice(value)).toBe(true);
        }
        expect(validateChoice('unsupported')).toBe(false);
        expect(validateChoice.errors).toHaveLength(1);
        expect(validateChoice.errors[0].keyword).toBe('enum');
    });

    test('standalone declarations expose row spacing only on the chart legend', () => {
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'chart-config-usage.ts'),
                declaration +
                    `
                    const legend: ChartLegend = {rowGap: 4};
                    legend.rowGap = '4px';
                    // @ts-expect-error Row gaps must be a number or string.
                    legend.rowGap = true;
                    // @ts-expect-error Row spacing is not an individual item option.
                    const item: ChartLegendItem = {rowGap: 4};
                `,
            ),
        ).not.toThrow();
    });

    test('schema exposes pixel row spacing with a compatible default', () => {
        expect(schema.definitions.ChartLegend.properties.rowGap).toMatchObject({
            type: ['number', 'string'],
            minimum: 0,
            default: 0,
        });
        expect(schema.definitions.ChartLegend.properties.rowGap.pattern).toBeUndefined();
        const validateConfig = createSchemaValidator().compile(schema);
        for (const rowGap of [undefined, 0, 4, 4.5, '4px', '.5px']) {
            expect(validateConfig({series: {data: []}, legend: {rowGap}})).toBe(true);
        }
        for (const rowGap of [-1, NaN, Infinity, -Infinity, true, null]) {
            expect(validateConfig({series: {data: []}, legend: {rowGap}})).toBe(false);
        }
    });

    test('documents scatter cluster defaults, grid units and overlap modes', () => {
        const cluster = schema.definitions.ScatterClusterOptions.properties;
        const layout = schema.definitions.ScatterClusterLayoutAlgorithmOptions.properties;

        expect(cluster.enabled.default).toBe(false);
        expect(cluster.minimumClusterSize.default).toBe(2);
        expect(layout.type).toMatchObject({const: 'grid', default: 'grid'});
        expect(layout.type.description).toContain("`'grid'`");
        expect(layout.gridSize).toMatchObject({default: 50});
        expect(layout.gridSize.description).toContain('relative to the plot width');
        expect(
            schema.definitions['ScatterSeries<JsonValue>'].properties.cluster.description,
        ).toContain('datetime X axis');
        expect(cluster.overlapMode).toMatchObject({
            enum: ['allow', 'shift'],
            default: 'allow',
            enumDescriptions: [
                'Leave cluster markers at their centroids.',
                'Move overlapping cluster markers within their cells when space permits.',
            ],
        });
        expect(declaration).toContain('percentages are relative to the plot width');
    });

    test('rejects invalid scatter cluster sizes in config tooling', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        const config = (cluster) => ({
            series: {
                data: [{type: 'scatter', name: 'S', data: [{x: 0, y: 1}], cluster}],
            },
        });

        expect(
            schema.definitions.ScatterClusterOptions.properties.minimumClusterSize,
        ).toMatchObject({
            minimum: 2,
            multipleOf: 1,
            default: 2,
        });
        for (const minimumClusterSize of [1, 2.5, -3]) {
            expect(validateConfig(config({enabled: true, minimumClusterSize}))).toBe(false);
        }
        for (const minimumClusterSize of [2, 3, 100]) {
            expect(validateConfig(config({enabled: true, minimumClusterSize}))).toBe(true);
        }
        for (const gridSize of [0, -1]) {
            expect(validateConfig(config({enabled: true, layoutAlgorithm: {gridSize}}))).toBe(
                false,
            );
        }
        for (const gridSize of [0.5, 50, '50px', '25%']) {
            expect(validateConfig(config({enabled: true, layoutAlgorithm: {gridSize}}))).toBe(true);
        }
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

    test('bar-x borders are exposed only on series and plugin options', () => {
        const usage = `
            const options: ChartSeriesOptions = {'bar-x': {borderWidth: 3, borderColor: 'black'}};
            const series: BarXSeries = {type: 'bar-x', name: 'A', data: [], borderWidth: 0, borderColor: 'red'};
            // @ts-expect-error Border width is a number in pixels.
            series.borderWidth = '3px';
            // @ts-expect-error Borders are not available on all series.
            const base: BaseSeries = {borderWidth: 3};
            // @ts-expect-error Per-point borders are not supported.
            const point: BarXSeriesData = {x: 1, y: 2, borderColor: 'red'};
            void [options, series, base, point];
        `;
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'chart-config-usage.ts'),
                declaration + usage,
            ),
        ).not.toThrow();
        const validateConfig = createSchemaValidator().compile(schema);
        const series = {type: 'bar-x', name: 'A', data: [{x: 1, y: 2}]};
        const borders = {borderWidth: 3, borderColor: 'black'};
        expect(validateConfig({series: {data: [{...series, ...borders}]}})).toBe(true);
        expect(validateConfig({series: {data: [series], options: {'bar-x': borders}}})).toBe(true);
        expect(validateConfig({series: {data: [{...series, borderWidth: '3px'}]}})).toBe(false);
        expect(
            validateConfig({series: {data: [series], options: {'bar-x': {borderColor: 123}}}}),
        ).toBe(false);
        expect(
            validateConfig({series: {data: [{...series, data: [{x: 1, y: 2, ...borders}]}]}}),
        ).toBe(false);
        expect(schema.definitions['BarXSeries<JsonValue>'].properties.borderWidth.default).toBe(0);
        expect(
            schema.definitions.ChartSeriesOptions.properties['bar-x'].properties.borderWidth
                .default,
        ).toBe(0);
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

    test('parses enum descriptions, keeps markers and normalizes whitespace', () => {
        const choiceSchema = {
            type: 'string',
            enum: ['a', 'b', null, 0],
            description:
                "Choices:\n- `'a'` (**recommended**): First   choice\n- `'b'` — Second choice\n- `null`: No choice",
        };

        normalizeSchema(choiceSchema);

        expect(choiceSchema.enumDescriptions).toEqual([
            '(**recommended**) First choice',
            'Second choice',
            'No choice',
            '',
        ]);
        expect(choiceSchema).not.toHaveProperty('oneOf');
    });

    test.each([
        [
            "- `'a'`: Description",
            /Missing JSDoc descriptions at #\/properties\/choice for enum values: "b"/,
        ],
        [
            "- `'a'`: Description\n- `'other'`: Invalid",
            /JSDoc enum value "other" is not allowed at #\/properties\/choice/,
        ],
        [
            "- `'a'`: \n- `'b'`: Description",
            /Invalid JSDoc enum description at #\/properties\/choice: - `'a'`:/,
        ],
        [
            "- `a`: Description\n- `'b'`: Description",
            /Invalid JSDoc enum description at #\/properties\/choice: - `a`:/,
        ],
        [
            "- 'a': Description\n- 'b': Description",
            /Invalid JSDoc enum description at #\/properties\/choice: - 'a':/,
        ],
    ])('rejects an invalid enum description: %s', (description, error) => {
        const choiceSchema = {
            type: 'object',
            properties: {choice: {type: 'string', enum: ['a', 'b'], description}},
        };

        expect(() => normalizeSchema(choiceSchema)).toThrow(error);
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
        [
            'scatter with grid clustering',
            {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'S',
                            data: [{x: 0, y: 1, custom: {id: 'A'}}],
                            cluster: {
                                enabled: true,
                                layoutAlgorithm: {type: 'grid', gridSize: '25%'},
                                overlapMode: 'shift',
                                marker: {symbol: 'circle', radius: 8, borderWidth: 1},
                                dataLabels: {enabled: true, allowOverlap: false},
                            },
                        },
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

    test('legend row count has a minimum of one and is available only on ChartLegend', () => {
        expect(schema.definitions.ChartLegend.properties.itemMaxRowCount).toMatchObject({
            type: 'number',
            minimum: 1,
            default: 1,
        });
        const validate = createSchemaValidator().compile(schema);
        for (const value of [1, 1.5, 3]) {
            expect(validate({series: {data: []}, legend: {itemMaxRowCount: value}})).toBe(true);
        }
        for (const value of [0, -1, '3']) {
            expect(validate({series: {data: []}, legend: {itemMaxRowCount: value}})).toBe(false);
        }
        expect(() =>
            validateDeclaration(
                path.resolve(__dirname, 'legend-config-usage.ts'),
                declaration +
                    `
            const legend: ChartLegend = {itemMaxRowCount: 3};
            // @ts-expect-error Row count is not a per-series override.
            const item: ChartLegendItem = {itemMaxRowCount: 3};
            void [legend, item];
        `,
            ),
        ).not.toThrow();
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

    test('excludes derived cluster metadata from raw scatter points', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        expect(
            validateConfig({
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'S',
                            data: [{x: 1, y: 2, cluster: {size: 2, points: []}}],
                        },
                    ],
                },
            }),
        ).toBe(false);
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

    test('rejects category objects on xAxis', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        expect(
            validateConfig({
                series: {data: [{type: 'radar', categories: [{key: 'A'}], data: [{value: 1}]}]},
                xAxis: {categories: [{key: 'A'}]},
            }),
        ).toBe(false);
        expect(validateConfig.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    instancePath: '/xAxis/categories/0',
                    keyword: 'type',
                    params: {type: 'string'},
                }),
            ]),
        );
    });

    test('accepts shared radar categories', () => {
        const validateConfig = createSchemaValidator().compile(schema);
        const categories = [{key: 'A'}];
        expect(
            validateConfig({
                series: {
                    data: [
                        {type: 'radar', data: [{value: 1}]},
                        {type: 'radar', categories, data: [{value: 2}]},
                    ],
                },
            }),
        ).toBe(true);
    });

    test('does not contain unsafe definition references', () => {
        expect(JSON.stringify(schema)).not.toMatch(/#\/definitions\/[^"%]*[<>]/);
    });
});
