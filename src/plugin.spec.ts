import { html } from "./plugin";

describe("Rollup plugin HTML/Lit", () => {
  it('returns a transformer plugin named "html"', () => {
    const plugin = html();
    expect(plugin.name).toBe("html");
    expect(plugin.transform).toBeInstanceOf(Function);
  });

  describe("transform", () => {
    it("returns nothing if the source file isn't an .html file", () => {
      // const ctx = jasmine.createSpyObj("TransformPluginContext", [
      //   "addWatchFile",
      // ]);
      const transform: any = html().transform;
      expect(transform("", "a.txt")).toBeUndefined();
    });
  });
});
