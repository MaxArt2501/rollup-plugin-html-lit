# Rollup plugin HTML/Lit

## Install

```
npm i -D rollup-plugin-html-lit
```

## Usage

Put the plugin before using Babel/TypeScript/any other code bundler:

```js
import typescript from '@rollup/plugin-typescript';
import { html } from 'rollup-plugin-html-lit';

export default {
  input: 'entry.ts',
  output: {
    // ...
  },
  plugins: {
    html(),
    // ...
    typescript(),
    // ...
  }
};
```

When using TypeScript, remember to declare `*.html` modules somewhere:

```ts
declare module "*.html" {
  const renderFn: (...args: unknown[]) => import("lit").TemplateResult<1>;
  export = renderFn;
}
```

Then you can import .html files and use them in your templates:

```ts
import { customElement, LitElement, html } from "lit-element";
import template from "./my-component.html";
import header from "./my-component-header.html";

@customElement("my-component")
export class MyComponent extends LitElement {
  render() {
    if (!this.header) {
      // Just return the template
      return template.call(this);
    }
    // Or compose it with other parts:
    return html`${header.call(this)}${template.call(this)}`;
  }
}
```

## Under the hood

The HTML files get transformed into functions. From this:

```html
<h1>${this.title}</h1>
```

you'll get this:

```js
import { html } from "lit-html";

export default function () {
  return html`<h1>${this.title}</h1>`;
}
```

So be careful to escape character like backticks and backslashes in your HTML.

### Template arguments

This also explains why you have to write `template.call(this)` in your code:
if this template uses `this` somewhere, it needs to know what "this" is...

If your HTML is static (whatever the point would be) you could just use
`template()` instead.

On the other hand, templates can also use _other_ arguments, if they're
specified in a special HTML comment, like this:

```html
<!-- @arguments (option) -->
<label>
  <input type="radio" value="${option.value}" name="${this.groupName}" />
  ${option.text}
</label>
```

## To do

[ ] Add tests
[ ] Better documentation
[ ] Fix the sourcemap
