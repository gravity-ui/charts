const fs = require('node:fs');
const path = require('node:path');

const ts = require('typescript');

function readExample(file) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const statement = ast.statements.find(
        (node) =>
            ts.isVariableStatement(node) &&
            node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
            node.declarationList.declarations.some(
                (declaration) => declaration.name.getText(ast) === 'meta',
            ),
    );
    const declaration = statement?.declarationList.declarations.find(
        (node) => node.name.getText(ast) === 'meta',
    );
    if (!declaration?.initializer) {
        throw new Error(`Example "${file}" is missing exported meta`);
    }
    if (statement.declarationList.declarations.length !== 1) {
        throw new Error(`Example "${file}" must declare meta separately`);
    }

    // Read literal metadata without executing the example or loading chart/browser dependencies.
    function readLiteral(node) {
        if (ts.isSatisfiesExpression(node)) return readLiteral(node.expression);
        if (ts.isStringLiteral(node)) return node.text;
        if (ts.isNumericLiteral(node)) return Number(node.text);
        if (ts.isObjectLiteralExpression(node)) {
            return Object.fromEntries(
                node.properties.map((property) => {
                    if (
                        !ts.isPropertyAssignment(property) ||
                        !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
                    ) {
                        throw new Error(`Example "${file}" metadata must use literal properties`);
                    }
                    return [property.name.text, readLiteral(property.initializer)];
                }),
            );
        }
        throw new Error(
            `Example "${file}" metadata must use literal strings, numbers, and objects`,
        );
    }

    const meta = readLiteral(declaration.initializer);
    const omitted = ast.statements.filter(
        (node) =>
            node === statement ||
            (ts.isImportDeclaration(node) &&
                node.importClause?.isTypeOnly &&
                node.importClause.namedBindings &&
                ts.isNamedImports(node.importClause.namedBindings) &&
                node.importClause.namedBindings.elements.every(
                    (item) => item.name.text === 'ExampleMeta',
                )),
    );
    let code = source;
    for (const node of omitted.reverse()) {
        code = code.slice(0, node.getFullStart()) + code.slice(node.end);
    }
    return {meta, code: code.trim()};
}

function readExamples(sourceDir) {
    const meta = {};
    function visit(dir) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                visit(file);
            } else if (entry.name.endsWith('.tsx')) {
                const id = path.relative(sourceDir, file).split(path.sep).join('/').slice(0, -4);
                meta[id] = readExample(file).meta;
            }
        }
    }
    visit(sourceDir);
    return meta;
}

module.exports = {readExample, readExamples};
