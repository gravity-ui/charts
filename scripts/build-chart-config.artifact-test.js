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

    beforeAll(() => {
        ({declaration, schema} = generateChartConfigArtifacts());
    });

    test('generates a standalone declaration bundle', () => {
        expect(getExternalDeclarationReferences(declaration, DECLARATION_PATH)).toEqual([]);
        expect(declaration).toContain('export interface ChartConfig');
        expect(Buffer.byteLength(declaration)).toBeLessThan(150_000);
    });

    test('validates declaration content without accessing the published file', () => {
        expect(() =>
            validateDeclaration(
                DECLARATION_PATH,
                'export interface BrokenDeclaration { value: MissingType; }',
            ),
        ).toThrow();
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
        expect(getExternalDeclarationReferences(externalDeclaration, DECLARATION_PATH)).not.toEqual(
            [],
        );
    });

    test.each([
        ["type External = import('external').External;", 'external'],
        ["type External = typeof import('external');", 'external'],
        ["import External = require('external');", 'external'],
    ])('reports an unquoted module name for %s', (externalDeclaration, moduleName) => {
        expect(getExternalDeclarationReferences(externalDeclaration, DECLARATION_PATH)).toEqual([
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
