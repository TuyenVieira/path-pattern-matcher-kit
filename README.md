# path-pattern-matcher-kit

Matches file paths against simple glob patterns containing single and double asterisks.

```js
import { match } from 'path-pattern-matcher-kit';

match('src/**/*.js', 'src/lib/core.js'); // true
match('src/*.js', 'src/lib/core.js');     // false
```

## Why this exists

A full glob engine pulls in a lot of machinery: brace expansion, character classes, negation, ordering rules. If you only need `*` and `**` to answer "does this path fit this shape?", that machinery is dead weight. This library compiles a pattern into a tiny token list and walks it against the path segments. The trade-off is explicit: no escaping, no character classes, no brace expansion. Patterns are split on `/` and each segment is either `*`, `**`, or a literal string.

## API

- `compile(pattern: string): Token[]` — turns a pattern into tokens. Throws `TypeError` if the pattern is not a string, and `Error` if it is empty.
- `matches(tokens: Token[], path: string): boolean` — matches a precompiled token list against a path. Throws `TypeError` if the arguments have the wrong type.
- `match(pattern: string, path: string): boolean` — convenience wrapper that compiles and matches in one call.

A `Token` is one of:

```ts
{ type: 1 }              // '*'
{ type: 2 }              // '**'
{ type: 3, value: string } // literal segment
```

## Behaviour notes

- `*` matches exactly one non-empty path segment.
- `**` matches zero or more path segments, including empty ones.
- The path is split on `/`, so `''` becomes `['']` (one empty segment) and `/a/b` starts with an empty segment. Leading and trailing slashes are significant.
- There is no escaping. A literal segment that happens to be `*` or `**` cannot be expressed; if you need that, this library is the wrong tool.
