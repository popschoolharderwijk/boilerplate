import ts from 'typescript';

export type LineHits = Map<number, number>;

export interface LcovFile {
	path: string;
	lines: LineHits;
}

export interface FnRange {
	name: string;
	startLine: number;
	endLine: number;
}

export function parseLcov(content: string): LcovFile[] {
	const files: LcovFile[] = [];
	let current: LcovFile | null = null;

	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line.startsWith('SF:')) {
			current = { path: line.slice(3), lines: new Map() };
			files.push(current);
			continue;
		}
		if (!current) continue;
		if (line.startsWith('DA:')) {
			const [lineNo, hits] = line.slice(3).split(',');
			current.lines.set(Number(lineNo), Number(hits));
		}
	}

	return files;
}

export function readFunctionRange(
	sourceFile: ts.SourceFile,
	startNode: ts.Node,
	endNode: ts.Node,
): { startLine: number; endLine: number } {
	const startLine = sourceFile.getLineAndCharacterOfPosition(startNode.getStart(sourceFile)).line + 1;
	const endLine = sourceFile.getLineAndCharacterOfPosition(endNode.end).line + 1;
	return { startLine, endLine };
}

export function readNamedFunctionFromVariableDeclaration(
	sourceFile: ts.SourceFile,
	parent: ts.VariableDeclaration,
	node: ts.FunctionExpression | ts.ArrowFunction,
): { name: string; startLine: number; endLine: number } | null {
	if (!ts.isIdentifier(parent.name)) return null;
	const range = readFunctionRange(sourceFile, parent, node);
	return { name: parent.name.text, ...range };
}

export function readNamedFunctionFromPropertyAssignment(
	sourceFile: ts.SourceFile,
	parent: ts.PropertyAssignment,
	node: ts.FunctionExpression | ts.ArrowFunction,
): { name: string; startLine: number; endLine: number } | null {
	if (!ts.isIdentifier(parent.name)) return null;
	const range = readFunctionRange(sourceFile, parent, node);
	return { name: parent.name.text, ...range };
}

export function readNamedFunctionFromMethodParent(
	sourceFile: ts.SourceFile,
	parent: ts.MethodDeclaration,
	node: ts.FunctionExpression | ts.ArrowFunction,
): { name: string; startLine: number; endLine: number } | null {
	if (!parent.name || !ts.isIdentifier(parent.name)) return null;
	const range = readFunctionRange(sourceFile, parent, node);
	return { name: parent.name.text, ...range };
}

export function readNamedFunctionFromParent(
	sourceFile: ts.SourceFile,
	node: ts.FunctionExpression | ts.ArrowFunction,
): { name: string; startLine: number; endLine: number } | null {
	const parent = node.parent;
	if (ts.isVariableDeclaration(parent)) {
		return readNamedFunctionFromVariableDeclaration(sourceFile, parent, node);
	}
	if (ts.isPropertyAssignment(parent)) {
		return readNamedFunctionFromPropertyAssignment(sourceFile, parent, node);
	}
	if (ts.isMethodDeclaration(parent)) {
		return readNamedFunctionFromMethodParent(sourceFile, parent, node);
	}
	return null;
}

export function collectFunctionDeclaration(sourceFile: ts.SourceFile, node: ts.FunctionDeclaration): FnRange | null {
	if (!node.name || !node.body) return null;
	const range = readFunctionRange(sourceFile, node, node);
	return { name: node.name.text, ...range };
}

export function collectMethodDeclaration(sourceFile: ts.SourceFile, node: ts.MethodDeclaration): FnRange | null {
	if (!node.name || !ts.isIdentifier(node.name) || !node.body) return null;
	const range = readFunctionRange(sourceFile, node, node);
	return { name: node.name.text, ...range };
}

export function collectNamedFunction(sourceFile: ts.SourceFile, node: ts.Node): FnRange | null {
	if (ts.isFunctionDeclaration(node)) return collectFunctionDeclaration(sourceFile, node);
	if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
		return readNamedFunctionFromParent(sourceFile, node);
	}
	if (ts.isMethodDeclaration(node)) return collectMethodDeclaration(sourceFile, node);
	return null;
}

export function collectFunctions(sourceFile: ts.SourceFile): FnRange[] {
	const functions: FnRange[] = [];
	const visit = (node: ts.Node) => {
		const collected = collectNamedFunction(sourceFile, node);
		if (collected) functions.push(collected);
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	return functions;
}

export function functionHitCount(lines: LineHits, fn: FnRange): number {
	let maxHits = 0;
	let anyCovered = false;
	for (let line = fn.startLine; line <= fn.endLine; line++) {
		const hits = lines.get(line);
		if (hits == null) continue;
		if (hits > 0) anyCovered = true;
		if (hits > maxHits) maxHits = hits;
	}
	return anyCovered ? Math.max(maxHits, 1) : 0;
}
