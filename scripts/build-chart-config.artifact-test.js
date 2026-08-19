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

    test('visits shared and cyclic schema nodes once', () => {
        const sharedSchema = {type: 'string'};
        const cyclicSchema = {properties: {first: sharedSchema, second: sharedSchema}};
        cyclicSchema.not = cyclicSchema;
        const visitedSchemas = [];

        visitSchema(cyclicSchema, (schemaNode) => visitedSchemas.push(schemaNode));

        expect(visitedSchemas).toEqual([cyclicSchema, sharedSchema]);
    });

    test('generates a strict JSON-only schema', () => {
        expect(() => validateSchema(schema)).not.toThrow();
        expect(getInvalidDefaults(schema)).toEqual([]);

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

        const validateConfig = createSchemaValidator().compile(schema);
        expect(
            validateConfig({
                series: {data: []},
                tooltip: {valueFormat: {type: 'custom'}},
            }),
        ).toBe(false);
        expect(validateConfig({series: {data: [], unknownProperty: true}})).toBe(false);
        expect(JSON.stringify(schema)).not.toMatch(/#\/definitions\/[^"%]*[<>]/);
    });
});
