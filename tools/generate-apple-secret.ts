import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';

const teamId = 'GEVW9YV737';
const clientId = 'com.anonymous.allergy-aware-recipe-finder.signin';
const keyId = '85539X999X';

// Resolve path relative to this script file
const keyPath = path.join(__dirname, 'AuthKey_85539X999X.p8');
const privateKey = fs.readFileSync(keyPath, 'utf8');

const token = jwt.sign(
  {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // ~6 months
    aud: 'https://appleid.apple.com',
    sub: clientId,
  },
  privateKey,
  {
    algorithm: 'ES256',
    keyid: keyId,
  }
);

console.log('🍎 Apple Client Secret:\n', token);
