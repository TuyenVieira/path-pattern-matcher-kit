import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile, matches, match } from '../src/index.js';

test('literal pattern matches identical path', () => {
  assert.equal(match('a/b/c', 'a/b/c'), true);
});

test('literal pattern does not match different path', () => {
  assert.equal(match('a/b/c', 'a/b/d'), false);
});

test('single star matches one non-empty segment', () => {
  assert.equal(match('a/*/c', 'a/b/c'), true);
});

test('single star does not match empty segment', () => {
  assert.equal(match('a/*/c', 'a//c'), false);
});

test('single star does not match multiple segments', () => {
  assert.equal(match('a/*/c', 'a/b/x/c'), false);
});

test('double star matches zero segments', () => {
  assert.equal(match('a/**/c', 'a/c'), true);
});

test('double star matches one segment', () => {
  assert.equal(match('a/**/c', 'a/b/c'), true);
});

test('double star matches many segments', () => {
  assert.equal(match('a/**/c', 'a/b/x/y/c'), true);
});

test('double star at start matches leading segments', () => {
  assert.equal(match('**/c', 'a/b/c'), true);
});

test('double star at end matches trailing segments', () => {
  assert.equal(match('a/**', 'a/b/c'), true);
});

test('double star alone matches everything including empty path', () => {
  // An empty path splits to [''], which is one empty segment.
  // GLOBSTAR matches zero or more segments, so it must match.
  assert.equal(match('**', ''), true);
});

test('double star alone matches a single segment', () => {
  assert.equal(match('**', 'x'), true);
});

test('double star alone matches multiple segments', () => {
  assert.equal(match('**', 'x/y/z'), true);
});

test('double star does not match when literal suffix mismatches', () => {
  assert.equal(match('a/**/c', 'a/b/d'), false);
});

test('pattern with trailing slash requires trailing empty segment', () => {
  assert.equal(match('a/b/', 'a/b/'), true);
  assert.equal(match('a/b/', 'a/b'), false);
});

test('leading slash is significant', () => {
  assert.equal(match('/a/b', '/a/b'), true);
  assert.equal(match('/a/b', 'a/b'), false);
});

test('compile returns token array with expected types', () => {
  const tokens = compile('a/*/**/b');
  assert.deepEqual(tokens, [
    { type: 3, value: 'a' },
    { type: 1 },
    { type: 2 },
    { type: 3, value: 'b' },
  ]);
});

test('matches accepts precompiled tokens', () => {
  const tokens = compile('a/*/c');
  assert.equal(matches(tokens, 'a/b/c'), true);
  assert.equal(matches(tokens, 'a/b/d'), false);
});

test('match rejects non-string pattern', () => {
  assert.throws(() => match(42, 'a'), { name: 'TypeError' });
});

test('match rejects empty pattern', () => {
  assert.throws(() => match('', 'a'), { message: 'pattern must not be empty' });
});

test('matches rejects non-array tokens', () => {
  assert.throws(() => matches('not an array', 'a'), { name: 'TypeError' });
});

test('matches rejects non-string path', () => {
  assert.throws(() => matches(compile('a'), 42), { name: 'TypeError' });
});
