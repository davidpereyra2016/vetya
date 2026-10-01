import mongoose from 'mongoose';
import { encryptCredential, decryptCredential } from '../utils/mercadoPagoCredentials.js';

const schema = new mongoose.Schema({
  stateHash: { type: String, required: true, unique: true },
  prestadorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  usuarioId: mongoose.Schema.Types.ObjectId,
  connectionVersion: Number,
  codeVerifier: { type: String, select: false, set: encryptCredential, get: decryptCredential },
  redirectUri: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export default mongoose.model('MercadoPagoOAuthState', schema);
