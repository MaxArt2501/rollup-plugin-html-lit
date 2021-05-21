import { SourceDescription } from "rollup";
import { html } from "./plugin";
import * as utils from "./utils";

describe("Rollup plugin HTML/Lit", () => {
  it('returns a transformer plugin named "html"', () => {
    const plugin = html();
    expect(plugin.name).toBe("html");
    expect(plugin.transform).toBeInstanceOf(Function);
  });

  describe("transform", () => {
    it("returns nothing if the source file isn't an .html file", () => {
      const transform: any = html().transform;
      expect(transform("", "a.txt")).toBeUndefined();
    });
    it("watches a single file if a string is passed in the `watch` option", () => {
      const ctx = { addWatchFile: jest.fn() };
      const transform: any = html({ watch: "foo.html" }).transform;
      transform.call(ctx, "", "/src/a.html");
      expect(ctx.addWatchFile).toHaveBeenCalledWith("foo.html");
    });
    it("watches multiple files if an array of strings is passed in the `watch` option", () => {
      const ctx = { addWatchFile: jest.fn() };
      const transform: any = html({
        watch: ["foo.html", "bar.html"],
      }).transform;
      transform.call(ctx, "", "/src/a.html");
      expect(ctx.addWatchFile.mock.calls).toEqual([["foo.html"], ["bar.html"]]);
    });
    it("minifies the HTML if the option `minify` is `true`", () => {
      const transform: any = html({
        minify: true,
      }).transform;
      const result: SourceDescription = transform(
        "<b>  ${test}  </b>",
        "/src/a.html"
      );
      expect(result.code).toBe(`import { html } from 'lit-html';

export default function() {
  return html\`<b>\${test}</b>\`;
}`);
    });
    it("prints the error if one has been thrown", () => {
      jest.spyOn(utils, "transformHTML").mockImplementation(() => {
        throw Error("test");
      });
      jest.spyOn(console, "error");
      const transform: any = html().transform;
      transform("test", "/src/a.html");
      expect((console.error as jest.Mock).mock.calls).toEqual([
        ["Error:\n\ttest"],
        ["Line:   undefined"],
        ["Column: undefined"],
      ]);
      (console.error as jest.Mock).mockRestore();
      (utils.transformHTML as jest.Mock).mockRestore();
    });
    it("rethrows the errore if the option `failOnError` is `true`", () => {
      jest.spyOn(utils, "transformHTML").mockImplementation(() => {
        throw Error("test");
      });
      const transform: any = html({ failOnError: true }).transform;
      expect(() =>
        transform("test", "/src/a.html")
      ).toThrow();
      (utils.transformHTML as jest.Mock).mockRestore();
    });
  });
});
