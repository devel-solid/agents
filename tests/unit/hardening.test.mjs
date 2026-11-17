import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson,
  rawHash,
  textHash,
  validateLock,
} from '../../dist/lock.js';
import { generationIdentity, serializeState } from '../../dist/state.js';
import { redact } from '../../dist/resolve.js';

test('JSON canônico ordena chaves e trata undefined sem produzir JSON inválido', () => {
  const value = {
    z: undefined,
    b: [undefined, , { b: undefined, a: 1 }],
    a: { retained: null },
  };
  assert.equal(
    canonicalJson(value),
    '{"a":{"retained":null},"b":[null,null,{"a":1}]}',
  );
  assert.deepEqual(
    JSON.parse(canonicalJson(value)),
    JSON.parse(JSON.stringify(value)),
  );
  assert.throws(() => canonicalJson(undefined), { code: 'CANONICAL_JSON' });
});

test('hash normalizado aceita LF/CRLF, distingue bytes brutos e rejeita UTF-8 inválido', () => {
  assert.equal(textHash('a\r\nb\r'), textHash('a\nb\n'));
  assert.notEqual(rawHash('a\r\n'), rawHash('a\n'));
  assert.throws(() => textHash(Buffer.from([0xc3, 0x28])), {
    code: 'CONTENT_UTF8',
  });
});

function lock() {
  return {
    schemaVersion: 1,
    rendererContract: 1,
    normalization: 'utf8-lf',
    engineVersion: '3.0.2',
    repository: 'https://example.invalid/base.git',
    requestedRef: 'v1.0.0',
    commit: 'a'.repeat(40),
    remote: { tplDir: 'templates/docs/conventions', entries: ['regra.tpl.md'] },
    sources: [
      { path: 'templates/AGENTS.tpl.md', sha256: 'b'.repeat(64) },
      {
        path: 'templates/docs/conventions/regra.tpl.md',
        sha256: 'c'.repeat(64),
      },
    ],
  };
}
test('validação de lock rejeita versões, hashes, caminhos e inventário inválidos', () => {
  assert.deepEqual(validateLock(lock()), lock());
  for (const mutate of [
    (value) => {
      value.schemaVersion = 2;
    },
    (value) => {
      value.sources[0].sha256 = 'bad';
    },
    (value) => {
      value.extra = true;
    },
    (value) => {
      value.remote.entries.push('regra.tpl.md');
    },
    (value) => {
      value.sources.reverse();
    },
    (value) => {
      value.sources[0].path = '../escape';
    },
    (value) => {
      value.sources[0].path = 'templates\\AGENTS.tpl.md';
    },
  ]) {
    const value = lock();
    mutate(value);
    assert.throws(() => validateLock(value));
  }
  const incompatible = lock();
  incompatible.rendererContract = 2;
  assert.throws(() => validateLock(incompatible), { code: 'LOCK_RENDERER' });
});

test('ownership tem identidade determinística e rejeita estado inconsistente antes da serialização', () => {
  const source = {
    path: 'templates/AGENTS.tpl.md',
    origin: 'local',
    sha256: textHash('# AGENTS\n'),
  };
  const base = {
    schemaVersion: 1,
    rendererContract: 1,
    normalization: 'utf8-lf',
    inputs: [source],
    outputs: [
      { path: 'AGENTS.md', sha256: textHash('Gerado\n'), sources: [source] },
    ],
  };
  const state = { ...base, generation: generationIdentity(base) };
  assert.deepEqual(JSON.parse(serializeState(state)), state);
  assert.equal(generationIdentity(structuredClone(base)), state.generation);
  const edited = structuredClone(state);
  edited.outputs[0].sha256 = '0'.repeat(64);
  assert.throws(() => serializeState(edited), { code: 'OWNERSHIP_SCHEMA' });
});

test('diagnósticos redigem credenciais em URLs, parâmetros e headers', () => {
  const result = redact(
    'https://login:privatePassword@example.invalid/base?token=querySecret Authorization: Bearer headerSecret ghp_fixtureSecret123',
  );
  for (const secret of [
    'login:',
    'privatePassword',
    'querySecret',
    'headerSecret',
    'ghp_fixtureSecret123',
  ])
    assert.equal(result.includes(secret), false);
});
