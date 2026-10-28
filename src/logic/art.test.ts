// Every pet sprite must be valid XML: the game loads each SVG as an image, and a browser drops an
// SVG with a repeated attribute on one tag (it showed as an empty lily pad for the heron chick).
import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { PET_IDS, petSvg } from '../render/pets';
import { commonPieces, hatPieces } from '../render/scenery';

function badTags(svg: string) {
  const bad: string[] = [];
  for (const m of svg.matchAll(/<([a-zA-Z]+)\s([^>]*?)\/?>/g)) {
    const names = [...m[2].matchAll(/([a-zA-Z-:]+)="/g)].map((a) => a[1]);
    if (new Set(names).size !== names.length) bad.push(m[0].slice(0, 80));
  }
  return bad;
}

test('art: no SVG tag repeats an attribute (pets, cat, hats, scenery)', () => {
  const all: [string, string][] = PET_IDS.map((id) => [id, petSvg(id)]);
  for (const [k, p] of Object.entries({ ...commonPieces(), ...hatPieces() })) all.push([k, p.svg]);
  for (const [name, svg] of all) assert.deepEqual(badTags(svg), [], name);
});
