import assert from 'node:assert/strict';
import {createPinVerifier,verifyPin} from '../cloudflare/pin-hash.mjs';
const verifier=await createPinVerifier('1234');
assert.match(verifier,/^pbkdf2-sha256-100000\\$/);
assert.equal(await verifyPin('1234',verifier),true);
assert.equal(await verifyPin('5678',verifier),false);
assert.equal(await verifyPin('123',verifier),false);
console.log('PASS parent and child PIN hash roundtrip with Cloudflare-compatible 100k verifier');
