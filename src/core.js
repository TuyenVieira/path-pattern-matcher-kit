const STAR = 1;
const GLOBSTAR = 2;
const LITERAL = 3;

/**
 * Compile a glob pattern into an array of tokens.
 *
 * The pattern is split on '/' and each segment is converted into a token:
 *   - '*' becomes a STAR token
 *   - '**' becomes a GLOBSTAR token
 *   - anything else becomes a LITERAL token
 *
 * We deliberately do not support character classes, braces, or escaping.
 * Keeping the grammar tiny means the matcher stays predictable and fast.
 */
export function compile(pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('pattern must be a string');
  }
  if (pattern.length === 0) {
    throw new Error('pattern must not be empty');
  }
  return pattern.split('/').map((segment) => {
    if (segment === '*') return { type: STAR };
    if (segment === '**') return { type: GLOBSTAR };
    return { type: LITERAL, value: segment };
  });
}

/**
 * Match a path against a compiled pattern.
 *
 * Matching is segment-by-segment. A STAR segment matches exactly one
 * non-empty path segment. A GLOBSTAR segment matches zero or more path
 * segments. A LITERAL segment matches exactly one segment with the same
 * string value.
 *
 * The path is split on '/' as well. Empty segments (e.g. from a leading
 * slash or a double slash) are kept and treated as ordinary segments; this
 * means '/a/b' and 'a/b' are different inputs, which is intentional because
 * the matcher is about relative path structure, not filesystem semantics.
 */
export function matches(tokens, path) {
  if (!Array.isArray(tokens)) {
    throw new TypeError('tokens must be an array');
  }
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }
  const parts = path.split('/');
  return matchParts(tokens, 0, parts, 0);
}

function matchParts(tokens, ti, parts, pi) {
  // If we have consumed all tokens, the path must also be fully consumed.
  if (ti === tokens.length) {
    return pi === parts.length;
  }

  const token = tokens[ti];

  if (token.type === GLOBSTAR) {
    // GLOBSTAR can match zero or more segments. Try every possible
    // consumption from zero up to the remaining path segments.
    for (let end = pi; end <= parts.length; end += 1) {
      if (matchParts(tokens, ti + 1, parts, end)) {
        return true;
      }
    }
    return false;
  }

  // Any other token consumes exactly one path segment.
  if (pi >= parts.length) {
    return false;
  }

  if (token.type === STAR) {
    // STAR matches a non-empty segment. Since parts are produced by
    // splitting a string on '/', an empty string represents an empty
    // segment and is not matched by STAR.
    if (parts[pi] === '') {
      return false;
    }
    return matchParts(tokens, ti + 1, parts, pi + 1);
  }

  // LITERAL
  if (parts[pi] !== token.value) {
    return false;
  }
  return matchParts(tokens, ti + 1, parts, pi + 1);
}

/**
 * Convenience: compile a pattern and match a path in one call.
 */
export function match(pattern, path) {
  return matches(compile(pattern), path);
}
