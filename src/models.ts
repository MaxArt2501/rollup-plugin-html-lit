import { Options } from 'html-minifier';

export interface ScriptChunk {
  pos: number;
  end: number;
}

export interface ScriptBit {
  row: number;
  column: number;
  name?: string;
}

export type Interval = [number, number];

export interface TransformResult {
  code: string;
  map: { mappings: string };
}

export interface HTMLLoaderSpecificOptions {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  failOnError?: boolean;
  minify?: boolean;
  watch?: string | string[];
}

export type HTMLLoaderOptions = HTMLLoaderSpecificOptions & Options;
