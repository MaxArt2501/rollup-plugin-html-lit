import { createFilter } from "rollup-pluginutils";
import { Plugin } from "rollup";

import { HTMLLoaderOptions } from "./models";
import { transformHTML } from "./utils";

export const html = (options: HTMLLoaderOptions = {}): Plugin => {
  const {
    include,
    exclude,
    watch,
    failOnError,
    minify: mustMinify,
    ...minifierOptions
  } = options;
  const filter = createFilter(include || ["/**/*.html"], exclude);

  return {
    name: "html",
    transform(source, id) {
      if (!filter(id)) {
        return;
      }

      if (watch) {
        const files = Array.isArray(watch) ? watch : [watch];
        files.forEach((file) => this.addWatchFile(file));
      }

      try {
        return transformHTML(source, mustMinify ? minifierOptions : undefined);
      } catch (e) {
        if (failOnError) {
          throw e;
        }
        console.error("Error:\n\t" + e.message);
        console.error("Line:   " + e.line);
        console.error("Column: " + e.column);
        return;
      }
    },
  };
};
