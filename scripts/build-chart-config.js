const fs = require('node:fs');
const path = require('node:path');

const Ajv = require('ajv');
const {generateDtsBundle} = require('dts-bundle-generator');
const {createGenerator} = require('ts-json-schema-generator');
const ts = require('typescript');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, 'package.json'), 'utf8'));
const ENTRY_FILE = path.resolve(ROOT_DIR, 'src/chart-config.ts');
const TSCONFIG_FILE = path.resolve(ROOT_DIR, 'tsconfig.chart-config.json');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'dist/config');
const DECLARATION_PATH = path.resolve(OUTPUT_DIR, 'chart-config.d.ts');
const SCHEMA_PATH = path.resolve(OUTPUT_DIR, 'chart-config.schema.json');

// A declaration bundle is standalone only while every package exposed by ChartConfig is inlined.
// If validateDeclaration reports an external reference, find the package that exports that type
// (starting from its import/module specifier) and add the package name here.
const INLINED_DECLARATION_LIBRARIES = ['@gravity-ui/date-utils', 'd3-selection'];

function getExternalDeclarationReferences(filePath, declaration) {
    const sourceFile = ts.createSourceFile(
        filePath,
        declaration,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const references = new Set([
        ...sourceFile.referencedFiles.map(({fileName}) => `reference path=${fileName}`),
        ...sourceFile.typeReferenceDirectives.map(({fileName}) => `reference types=${fileName}`),
        ...sourceFile.libReferenceDirectives.map(({fileName}) => `reference lib=${fileName}`),
        ...sourceFile.amdDependencies.map(
            ({path: dependencyPath}) => `amd-dependency=${dependencyPath}`,
        ),
    ]);

    function visit(node) {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier)
        ) {
            references.add(node.moduleSpecifier.text);
        } else if (
            ts.isImportEqualsDeclaration(node) &&
            ts.isExternalModuleReference(node.moduleReference)
        ) {
            const expression = node.moduleReference.expression;
            references.add(
                expression && ts.isStringLiteral(expression)
                    ? expression.text
                    : expression?.getText(sourceFile) || 'external module',
            );
        } else if (ts.isImportTypeNode(node)) {
            references.add(node.argument.literal?.text ?? node.argument.getText(sourceFile));
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return [...references];
}

function validateDeclaration(filePath, declaration) {
    const externalReferences = getExternalDeclarationReferences(filePath, declaration);

    if (externalReferences.length > 0) {
        throw new Error(
            [
                `chart-config.d.ts must be standalone; found: ${externalReferences.join(', ')}`,
                'If a reference comes from a package, add its owning package to',
                'INLINED_DECLARATION_LIBRARIES in scripts/build-chart-config.js.',
            ].join(' '),
        );
    }

    const configFile = ts.readConfigFile(TSCONFIG_FILE, ts.sys.readFile);

    if (configFile.error) {
        throw new Error(
            ts.formatDiagnostic(configFile.error, {
                getCanonicalFileName: (fileName) => fileName,
                getCurrentDirectory: () => ROOT_DIR,
                getNewLine: () => '\n',
            }),
        );
    }

    const config = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(TSCONFIG_FILE),
    );

    if (config.errors.length > 0) {
        throw new Error(
            ts.formatDiagnostics(config.errors, {
                getCanonicalFileName: (fileName) => fileName,
                getCurrentDirectory: () => ROOT_DIR,
                getNewLine: () => '\n',
            }),
        );
    }

    const compilerOptions = {
        ...config.options,
        noEmit: true,
        skipLibCheck: false,
    };
    const declarationFilePath = path.resolve(filePath);
    const declarationSourceFile = ts.createSourceFile(
        declarationFilePath,
        declaration,
        compilerOptions.target || ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const compilerHost = ts.createCompilerHost(compilerOptions);
    const getSourceFile = compilerHost.getSourceFile.bind(compilerHost);
    const fileExists = compilerHost.fileExists.bind(compilerHost);
    const readFile = compilerHost.readFile.bind(compilerHost);
    const getCanonicalFilePath = (candidatePath) => {
        const resolvedPath = path.resolve(candidatePath);

        return ts.sys.useCaseSensitiveFileNames ? resolvedPath : resolvedPath.toLowerCase();
    };
    const canonicalDeclarationFilePath = getCanonicalFilePath(declarationFilePath);
    const isDeclarationFile = (candidatePath) =>
        getCanonicalFilePath(candidatePath) === canonicalDeclarationFilePath;

    compilerHost.fileExists = (candidatePath) =>
        isDeclarationFile(candidatePath) || fileExists(candidatePath);
    compilerHost.readFile = (candidatePath) =>
        isDeclarationFile(candidatePath) ? declaration : readFile(candidatePath);
    compilerHost.getSourceFile = (candidatePath, ...args) =>
        isDeclarationFile(candidatePath)
            ? declarationSourceFile
            : getSourceFile(candidatePath, ...args);

    const program = ts.createProgram([declarationFilePath], compilerOptions, compilerHost);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    if (diagnostics.length > 0) {
        throw new Error(
            ts.formatDiagnosticsWithColorAndContext(diagnostics, {
                getCanonicalFileName: (fileName) => fileName,
                getCurrentDirectory: () => ROOT_DIR,
                getNewLine: () => '\n',
            }),
        );
    }
}

const SCHEMA_CHILD_MAP_KEYS = [
    '$defs',
    'definitions',
    'dependentSchemas',
    'patternProperties',
    'properties',
];
const SCHEMA_CHILD_ARRAY_KEYS = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
const SCHEMA_CHILD_SINGLE_KEYS = [
    'additionalItems',
    'additionalProperties',
    'contains',
    'else',
    'if',
    'items',
    'not',
    'propertyNames',
    'then',
];

function getSchemaChildEntries(schema) {
    const entries = [];

    for (const mapKey of SCHEMA_CHILD_MAP_KEYS) {
        const schemaMap = schema[mapKey];

        if (schemaMap && typeof schemaMap === 'object' && !Array.isArray(schemaMap)) {
            for (const [key, child] of Object.entries(schemaMap)) {
                entries.push([`${mapKey}/${key}`, child]);
            }
        }
    }

    for (const arrayKey of SCHEMA_CHILD_ARRAY_KEYS) {
        const schemaArray = schema[arrayKey];

        if (Array.isArray(schemaArray)) {
            schemaArray.forEach((child, index) => {
                entries.push([`${arrayKey}/${index}`, child]);
            });
        }
    }

    for (const singleKey of SCHEMA_CHILD_SINGLE_KEYS) {
        const childSchema = schema[singleKey];

        if (Array.isArray(childSchema)) {
            childSchema.forEach((child, index) => {
                entries.push([`${singleKey}/${index}`, child]);
            });
        } else if (childSchema && typeof childSchema === 'object') {
            entries.push([singleKey, childSchema]);
        }
    }

    if (schema.dependencies && typeof schema.dependencies === 'object') {
        for (const [key, dependency] of Object.entries(schema.dependencies)) {
            if (!Array.isArray(dependency) && dependency && typeof dependency === 'object') {
                entries.push([`dependencies/${key}`, dependency]);
            }
        }
    }

    return entries;
}

function getSchemaChildren(schema) {
    return getSchemaChildEntries(schema).map(([, child]) => child);
}

function visitSchema(schema, visitor, visited = new WeakSet()) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema) || visited.has(schema)) {
        return;
    }

    visited.add(schema);
    visitor(schema);

    for (const childSchema of getSchemaChildren(schema)) {
        visitSchema(childSchema, visitor, visited);
    }
}

function getDefinitionName(reference) {
    const prefix = '#/definitions/';

    if (typeof reference !== 'string' || !reference.startsWith(prefix)) {
        return undefined;
    }

    const encodedName = reference.slice(prefix.length).split('/')[0];

    try {
        return decodeURIComponent(encodedName).replaceAll('~1', '/').replaceAll('~0', '~');
    } catch {
        return null;
    }
}

function resolveSchema(schema, rootSchema, visited = new Set()) {
    const definitionName = getDefinitionName(schema?.$ref);

    if (!definitionName || visited.has(definitionName)) {
        return schema;
    }

    const definition = rootSchema.definitions?.[definitionName];

    if (!definition) {
        return schema;
    }

    visited.add(definitionName);

    return resolveSchema(definition, rootSchema, visited);
}

function isClosedEmptyObject(schema) {
    return (
        schema?.type === 'object' &&
        schema.additionalProperties === false &&
        Object.keys(schema.properties || {}).length === 0 &&
        !schema.patternProperties &&
        !schema.allOf &&
        !schema.anyOf &&
        !schema.oneOf &&
        !schema.required
    );
}

function isNullOnlySchema(schema) {
    return (
        schema?.type === 'null' ||
        schema?.const === null ||
        (Array.isArray(schema?.enum) && schema.enum.length === 1 && schema.enum[0] === null)
    );
}

function isCallbackArtifact(schema, rootSchema) {
    const resolvedSchema = resolveSchema(schema, rootSchema);

    return isClosedEmptyObject(resolvedSchema) || isNullOnlySchema(resolvedSchema);
}

function normalizeSchemaNodes(
    schema,
    rootSchema,
    state = {changed: false},
    visited = new WeakSet(),
) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema) || visited.has(schema)) {
        return;
    }

    visited.add(schema);

    // Remove non-JSON properties before descending so discarded subtrees are not traversed.
    // With functions: 'hide', ts-json-schema-generator represents callback-only properties as
    // null or a closed empty object. Closed empty branches can also represent non-JSON class
    // instances (for example Duration), so they are removed from unions below as well.
    if (schema.properties) {
        for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
            if (isCallbackArtifact(propertySchema, rootSchema)) {
                if (schema.required?.includes(propertyName)) {
                    throw new Error(
                        `Cannot omit required callback-only property "${propertyName}" from chart-config.schema.json`,
                    );
                }

                delete schema.properties[propertyName];
                state.changed = true;
            }
        }
    }

    if (Array.isArray(schema.anyOf)) {
        const before = schema.anyOf.length;
        schema.anyOf = schema.anyOf.filter(
            (childSchema) => !isClosedEmptyObject(resolveSchema(childSchema, rootSchema)),
        );

        if (schema.anyOf.length !== before) {
            state.changed = true;
        }

        if (schema.anyOf.length === 0) {
            delete schema.anyOf;
        }
    }

    for (const childSchema of getSchemaChildren(schema)) {
        normalizeSchemaNodes(childSchema, rootSchema, state, visited);
    }
}

function collectDefinitionReferences(
    schema,
    references,
    skipDefinitions = false,
    visited = new WeakSet(),
    definitionValueSet = schema.definitions
        ? new Set(Object.values(schema.definitions))
        : new Set(),
) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema) || visited.has(schema)) {
        return;
    }

    visited.add(schema);
    const definitionName = getDefinitionName(schema.$ref);

    if (definitionName) {
        references.add(definitionName);
    }

    for (const childSchema of getSchemaChildren(schema)) {
        if (skipDefinitions && definitionValueSet.has(childSchema)) {
            continue;
        }

        collectDefinitionReferences(
            childSchema,
            references,
            skipDefinitions,
            visited,
            definitionValueSet,
        );
    }
}

function removeUnusedDefinitions(schema) {
    const reachableDefinitions = new Set();
    const pendingDefinitions = new Set();
    collectDefinitionReferences(schema, pendingDefinitions, true);

    while (pendingDefinitions.size > 0) {
        const [definitionName] = pendingDefinitions;
        pendingDefinitions.delete(definitionName);

        if (reachableDefinitions.has(definitionName)) {
            continue;
        }

        const definition = schema.definitions?.[definitionName];

        if (!definition) {
            continue;
        }

        reachableDefinitions.add(definitionName);
        collectDefinitionReferences(definition, pendingDefinitions);
    }

    for (const definitionName of Object.keys(schema.definitions || {})) {
        if (!reachableDefinitions.has(definitionName)) {
            delete schema.definitions[definitionName];
        }
    }
}

function createSchemaValidator() {
    return new Ajv({allErrors: true, allowUnionTypes: true, strict: 'log'});
}

function getInvalidDefaults(schema) {
    const defaultEntries = [];
    const visited = new WeakSet();

    const walk = (node, path) => {
        if (!node || typeof node !== 'object' || Array.isArray(node) || visited.has(node)) {
            return;
        }

        visited.add(node);

        if (Object.prototype.hasOwnProperty.call(node, 'default')) {
            const schemaWithoutDefault = {...node};
            delete schemaWithoutDefault.default;
            defaultEntries.push({
                schema: node,
                path: path.length === 0 ? '#' : `#/${path.join('/')}`,
                schemaWithoutDefault,
                value: node.default,
            });
        }

        for (const [segment, child] of getSchemaChildEntries(node)) {
            walk(child, [...path, segment]);
        }
    };

    walk(schema, []);

    if (defaultEntries.length === 0) {
        return [];
    }

    // Compile all default checks as one tuple so every item shares the root definitions. This
    // avoids retaining a copy of the complete definitions map for every default value.
    const defaultsSchema = {
        type: 'array',
        items: defaultEntries.map(({schemaWithoutDefault}) => schemaWithoutDefault),
        minItems: defaultEntries.length,
        maxItems: defaultEntries.length,
        definitions: schema.definitions,
    };
    const validateDefaults = createSchemaValidator().compile(defaultsSchema);
    const defaults = defaultEntries.map(({value}) => value);

    if (validateDefaults(defaults)) {
        return [];
    }

    const errorsByIndex = new Map();

    for (const error of validateDefaults.errors || []) {
        const indexMatch = error.instancePath.match(/^\/(\d+)(?:\/|$)/);

        if (!indexMatch) {
            continue;
        }

        const index = Number(indexMatch[1]);
        const errors = errorsByIndex.get(index) || [];
        errors.push(error);
        errorsByIndex.set(index, errors);
    }

    return [...errorsByIndex].map(([index, errors]) => ({
        errors,
        path: defaultEntries[index].path,
        schema: defaultEntries[index].schema,
        value: defaultEntries[index].value,
    }));
}

function removeInvalidDefaults(schema) {
    for (const invalidDefault of getInvalidDefaults(schema)) {
        const {errors, path, schema: invalidSchema, value} = invalidDefault;
        const reason = errors[0]?.message ?? 'invalid default';
        console.warn(
            `[chart-config] stripping invalid @default at ${path}: ${JSON.stringify(value)} (${reason})`,
        );
        delete invalidSchema.default;
    }
}

function normalizeSchema(schema) {
    // Run normalizeSchemaNodes to a fixpoint: a definition that only becomes callback-only after
    // its own normalization wouldn't be detected by a single pass over its referencing nodes.
    let state;

    do {
        state = {changed: false};
        normalizeSchemaNodes(schema, schema, state);
        removeUnusedDefinitions(schema);
    } while (state.changed);
    removeInvalidDefaults(schema);

    schema.$id = `${PACKAGE_JSON.name}/chart-config.schema.json@${PACKAGE_JSON.version}`;
    schema.title = 'ChartConfig';
    schema.version = PACKAGE_JSON.version;

    return schema;
}

function validateSchema(schema) {
    const chartConfig = schema.definitions?.ChartConfig;

    if (schema.$ref !== '#/definitions/ChartConfig') {
        throw new Error(
            'chart-config.schema.json must have top-level $ref ' +
                `"#/definitions/ChartConfig"; received: ${JSON.stringify(schema.$ref)}`,
        );
    }

    if (!chartConfig) {
        throw new Error('chart-config.schema.json must contain a "ChartConfig" root definition');
    }

    if (!chartConfig.required?.includes('series')) {
        throw new Error(
            'chart-config.schema.json must require "series" in the "ChartConfig" definition',
        );
    }

    visitSchema(schema, (schemaNode) => {
        if (typeof schemaNode.$ref !== 'string') {
            return;
        }

        const definitionName = getDefinitionName(schemaNode.$ref);

        if (
            /[<>\s]/.test(schemaNode.$ref) ||
            definitionName === null ||
            (definitionName && !schema.definitions?.[definitionName])
        ) {
            throw new Error(
                `chart-config.schema.json contains an invalid $ref: ${schemaNode.$ref}`,
            );
        }
    });

    const ajv = createSchemaValidator();

    if (!ajv.validateSchema(schema)) {
        throw new Error(`Invalid chart config JSON Schema: ${ajv.errorsText(ajv.errors)}`);
    }

    const validateConfig = ajv.compile(schema);

    if (!validateConfig({series: {data: []}})) {
        throw new Error(
            `chart-config.schema.json rejects a minimal config: ${ajv.errorsText(validateConfig.errors)}`,
        );
    }

    if (validateConfig({series: {data: []}, unknownProperty: true})) {
        throw new Error('chart-config.schema.json must reject unknown top-level properties');
    }

    if (validateConfig({series: {data: [], unknownProperty: true}})) {
        throw new Error('chart-config.schema.json must reject unknown nested properties');
    }

    visitSchema(schema, (schemaNode) => {
        for (const [propertyName, propertySchema] of Object.entries(schemaNode.properties || {})) {
            if (isCallbackArtifact(propertySchema, schema)) {
                throw new Error(
                    `chart-config.schema.json contains a callback-only property: "${propertyName}"`,
                );
            }
        }
    });
}

function generateChartConfigArtifacts() {
    const [declaration] = generateDtsBundle(
        [
            {
                filePath: ENTRY_FILE,
                libraries: {
                    inlinedLibraries: INLINED_DECLARATION_LIBRARIES,
                },
                output: {
                    exportReferencedTypes: false,
                    noBanner: true,
                },
            },
        ],
        {preferredConfigPath: TSCONFIG_FILE},
    );

    validateDeclaration(DECLARATION_PATH, declaration);

    const schema = createGenerator({
        additionalProperties: false,
        functions: 'hide',
        path: ENTRY_FILE,
        topRef: true,
        tsconfig: TSCONFIG_FILE,
        type: 'ChartConfig',
    }).createSchema('ChartConfig');

    normalizeSchema(schema);
    validateSchema(schema);

    return {declaration, schema};
}

function writeChartConfigArtifacts(
    {declaration, schema},
    {declarationPath = DECLARATION_PATH, schemaPath = SCHEMA_PATH} = {},
) {
    for (const dir of new Set([path.dirname(declarationPath), path.dirname(schemaPath)])) {
        fs.mkdirSync(dir, {recursive: true});
    }
    fs.writeFileSync(declarationPath, declaration);
    fs.writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);
}

function buildChartConfig() {
    const artifacts = generateChartConfigArtifacts();
    writeChartConfigArtifacts(artifacts);

    return artifacts;
}

if (require.main === module) {
    buildChartConfig();
}

module.exports = {
    buildChartConfig,
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
};
