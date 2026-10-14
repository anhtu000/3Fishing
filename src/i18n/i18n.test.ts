// Every language has every English key, with the same {placeholders}.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import it from './it.json';
import tr from './tr.json';

type Tree = { [k: string]: string | Tree };
function flat(d: Tree, p = '', o: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(d)) {
    const key = p ? `${p}.${k}` : k;
    if (typeof v === 'string') o[key] = v;
    else flat(v, key, o);
  }
  return o;
}
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

for (const [name, file] of Object.entries({ fr, de, es, it, tr })) {
  test(`${name} matches en`, () => {
    const a = flat(en as Tree);
    const b = flat(file as Tree);
    assert.deepEqual(Object.keys(b).sort(), Object.keys(a).sort());
    for (const k of Object.keys(a)) assert.equal(vars(b[k]), vars(a[k]), `${name}: ${k}`);
  });
}
