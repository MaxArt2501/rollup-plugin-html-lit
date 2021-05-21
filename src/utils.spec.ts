import {
  generateHTMLSourceMap,
  getAllChunks,
  getCoords,
  getExpressionPositions,
  getUncoveredIntervals,
  isChunk,
  transformHTML,
} from "./utils";

describe("getExpressionPositions", () => {
  it("returns an array of intervals corresponding to the expressions inside the HTML code", () => {
    const results = getExpressionPositions("<div>${value}</div>");
    expect(results).toEqual([[8, 13]]);
  });
  it("returns an empty array if there are no template literal expressions inside the HTML code", () => {
    const results = getExpressionPositions("<div>Static</div>");
    expect(results).toEqual([]);
  });
});

describe("isChunk", () => {
  it("returns `true` if the argument has numeric `pos` and `end` properties", () => {
    expect(isChunk({ pos: 0, end: 0 })).toBe(true);
  });
  it("returns `false` if the argument is not an object or has not numeric `pos` and `end` properties", () => {
    expect(isChunk({})).toBe(false);
    expect(isChunk({ pos: 42 })).toBe(false);
  });
});

describe("getAllChunks", () => {
  it("returns all the chunks inside a TypeScript expression", () => {
    const chunks = getAllChunks({
      pos: 0,
      end: 10,
      child: {
        pos: 3,
        end: 7,
      },
    });
    expect(chunks).toEqual([
      [0, 3],
      [3, 7],
      [7, 10],
    ]);
  });
});

describe("getCoords", () => {
  it("returns the row and column of a linear position in a text string", () => {
    expect(getCoords("foo\nbar", 5)).toEqual([1, 1]);
  });
});

describe("getUncoveredIntervals", () => {
  it("returns an iterator over the uncovered intervals of a given super-interval", () => {
    const uncovered = Array.from(
      getUncoveredIntervals(
        [0, 10],
        [
          [3, 5],
          [5, 7],
        ]
      )
    );
    expect(uncovered).toEqual([
      [0, 3],
      [7, 10],
    ]);
  });
});

describe("generateHTMLSourceMap", () => {
  it("returns the sourcemap's mappings for the given source-to-minified code", () => {
    const mappings = generateHTMLSourceMap(
      "<div>\n  ${value}\n</div>",
      "<div>${value}</div>",
      "export default `<div>${value}</div>`;"
    );
    expect(mappings).toBe("eAEK,QADD,KAAK");
  });
});

describe("transformHTML", () => {
  it("returns empty code and sourcemap if the source is an empty string", () => {
    expect(transformHTML("")).toEqual({ code: "", map: { mappings: "" } });
  });
  it("transforms the HTML code into a JS/TS function", () => {
    const result = transformHTML("<div>${value}</div>");
    expect(result).toEqual({
      code: `import { html } from 'lit-html';
\nexport default function() {
  return html\`<div>\${value}</div>\`;
}`,
      map: ";;;aAAkB,QAAX,KAAK",
    });
  });
  it("creates a function with arguments if there's an @argument HTML comment", () => {
    const result = transformHTML(
      "<!-- @arguments (value) -->\n<div>${value}</div>"
    );
    expect(result).toEqual({
      code: `import { html } from 'lit-html';
\nexport default function(value) {
  return html\`\n<div>\${value}</div>\`;
}`,
      map: ";;;aACkB;OAAX,KAAK",
    });
  });
  it("minifies the HTML if `minifierOptions` are passed", () => {
    const result = transformHTML(
      "<div>             ${value}                  </div>",
      {}
    );
    expect(result).toEqual({
      code: `import { html } from 'lit-html';
\nexport default function() {
  return html\`<div>\${value}</div>\`;
}`,
      map: ";;;aAAiD,QAA7B,KAAK",
    });
  });
});
