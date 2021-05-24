import { createSourceFile, ExpressionStatement, ScriptTarget, SyntaxKind, TemplateExpression } from 'typescript';
import { minify, Options } from 'html-minifier';
import { encode } from 'vlq';
import { Interval, ScriptChunk } from './models';
import { TransformResult } from 'rollup';

/**
 * Returns the starting and ending positions of expression chunks inside the
 * HTML code
 */
export const getExpressionPositions = (html: string): Interval[] => {
  const ast = createSourceFile('x.ts', `\`${html}\``, ScriptTarget.Latest);
  const { expression } = ast.statements[0] as ExpressionStatement;
  return expression.kind === SyntaxKind.TemplateExpression
    ? (expression as TemplateExpression).templateSpans.flatMap(span => getAllChunks(span.expression))
    : [];
};

/**
 * Returns whether a value is a `ScriptChunk`
 */
export const isChunk = (value: any): value is ScriptChunk => typeof value?.pos === 'number' && typeof value!.end === 'number';

/**
 * Returns all the intervals for a given Expression
 */
export const getAllChunks = <T extends ScriptChunk>(chunk: T): Interval[] => {
  const subChunks = Object.values(chunk).filter(isChunk);
  if (subChunks.length === 0) {
    return [[chunk.pos, chunk.end]];
  }
  const positions: Interval[] = subChunks.flatMap(getAllChunks);
  const intervals: Interval[] = [...positions, ...getUncoveredIntervals([chunk.pos, chunk.end], positions)].sort(
    ([start1], [start2]) => start1 - start2
  );
  return intervals;
};

/**
 *
 */
export function* getUncoveredIntervals(interval: Interval, chunks: Array<Interval>) {
  const [start, end] = interval;
  let index = start;
  while (index < end) {
    const containingChunk = chunks.find(([chunkStart, chunkEnd]) => index >= chunkStart && index < chunkEnd);
    if (containingChunk) {
      index = containingChunk[1];
    } else {
      const nextChunk = chunks.reduce((prevChunk: Interval | null, curChunk: Interval) => {
        if (curChunk[0] > index && (!prevChunk || prevChunk[0] > curChunk[0])) {
          return curChunk;
        }
        return prevChunk;
      }, null);
      const nextIndex = nextChunk?.[0] ?? end;
      const nextInterval: Interval = [index, nextIndex];
      yield nextInterval;
      index = nextIndex;
    }
  }
}

/**
 * Returns the row and column of the given linear position inside the given source code
 */
export const getCoords = (source: string, position: number): Interval => {
  const rows = source.slice(0, position).split('\n');
  return [rows.length - 1, rows[rows.length - 1].length];
};

/**
 * Generates the source map for the transformed code, given the souce
 */
export const generateHTMLSourceMap = (html: string, minified: string, transformed: string) => {
  const rawBits = getExpressionPositions(html);
  const rawUncov = Array.from(getUncoveredIntervals([0, html.length + 1], rawBits));
  const minBits = getExpressionPositions(minified);
  const minUncov = Array.from(getUncoveredIntervals([0, minified.length + 1], minBits));
  const headerShift = transformed.indexOf(minified);

  const allRawChunks = [...rawBits, ...rawUncov].sort(([start1], [start2]) => start1 - start2).map(([start]) => getCoords(html, start - 1));
  const allMinChunks = [...minBits, ...minUncov]
    .sort(([start1], [start2]) => start1 - start2)
    .map(([start]) => getCoords(transformed, start + headerShift - 1));

  const minRowChunks = Array.from({ length: allMinChunks[allMinChunks.length - 1][0] + 1 }, (_, row) =>
    allMinChunks.filter(([chRow]) => chRow === row).map(([, column]) => column)
  );

  let prevSource = [0, 0];
  let index = 0;
  const minRowVectors = minRowChunks.map(cols => {
    let prevColumn = 0;
    return cols.map(column => {
      const [sourceRow, sourceCol] = allRawChunks[index++];
      const diffCol = column - prevColumn;
      const diffSourceRow = sourceRow - prevSource[0];
      const diffSourceCol = sourceCol - prevSource[1];
      prevSource = [sourceRow, sourceCol];
      prevColumn = column;
      return [diffCol, 0, diffSourceRow, diffSourceCol];
    });
  });

  return minRowVectors.map(vecs => vecs.map(encode)).join(';');
};

const ARGS_RE = /^\s*<!--\s*@arguments\s+\(\s*([a-z_]\w*(?:\s*,\s*[a-z_]\w*)*)\s*\)\s*-->/im;

/**
 * Transform the given HTML source with the given options
 */
export const transformHTML = (html: string, minifierOptions?: Options): TransformResult => {
  if (!html.length) {
    return { code: '', map: { mappings: '' } };
  }
  const argsMatch = html.match(ARGS_RE);
  const args = argsMatch ? argsMatch[1].split(/\s*,\s*/) : [];
  const minified = minifierOptions
    ? minify(html, {
        collapseWhitespace: true,
        decodeEntities: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        ...minifierOptions
      })
    : html.replace(ARGS_RE, '');

  const header = `import { html } from 'lit-html';\n\nexport default function(${args.join(', ')}) {\n  return html\``;
  const transformed = `${header}${minified}\`;\n}`;
  const mappings = generateHTMLSourceMap(html, minified, transformed);

  return { code: transformed, map: { mappings, version: 3, names: [], sources: [null as unknown as string] } };
};
