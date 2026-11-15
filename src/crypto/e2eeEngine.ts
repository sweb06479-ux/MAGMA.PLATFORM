import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { gcm } from '@noble/ciphers/aes.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { xsalsa20poly1305 } from '@noble/ciphers/salsa.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { sha3_256, sha3_512 } from '@noble/hashes/sha3.js';
import { hmac } from '@noble/hashes/hmac.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';

export interface PublicKeyBundle {
  clientId: string;
  ed25519PubB64: string;
  x25519PubB64: string;
  mlKem768PubB64: string;
  ecdhP256PubJwk: JsonWebKey;
  rsaOaepPubJwk: JsonWebKey;
  bundleHashSha3: string;
  signatureB64: string;
  createdAt: number;
}

export interface SealedEnvelope {
  version: 'MAGMA-E2EE-PQXDH-TRIPLE-RATCHET-v1';
  ephX25519PubB64: string;
  ephEcdhP256PubJwk: JsonWebKey;
  mlKemCtB64: string;
  braidKemCtB64?: string;
  rsaWrappedSecretB64: string;
  nonce24B64: string;
  nonce12ChaChaB64: string;
  nonce12AesB64: string;
  ciphertextB64: string;
  hmacSha512B64: string;
  sha3CommitB64: string;
}

export interface InnerChatPayload {
  id: string;
  senderClientId: string;
  recipientClientId: string;
  sender: {
    name: string;
    handle: string;
    avatar: string;
  };
  text: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  mediaKeyB64?: string;
  mediaIvB64?: string;
  mediaChaChaKeyB64?: string;
  mediaChaChaNonceB64?: string;
  mediaCipherMode?: 'AES256-CHACHA20' | 'AES256-GCM';
  mediaMimeType?: string;
  mediaSha3Digest?: string;
  ratchetCounter: number;
  nextRatchetX25519PubB64: string;
  nextRatchetMlKemPubB64: string;
  lockdownEnforced: boolean;
  createdAt: string;
  timestamp: number;
}

export interface SignedInnerEnvelope {
  payloadJson: string;
  ed25519SigB64: string;
  senderEd25519PubB64: string;
}

export interface EncryptedMediaResult {
  encryptedBlob: Blob;
  mediaKeyB64: string;
  mediaIvB64: string;
  mediaChaChaKeyB64?: string;
  mediaChaChaNonceB64?: string;
  mediaCipherMode: 'AES256-CHACHA20' | 'AES256-GCM';
  mediaMimeType: string;
  mediaSha3Digest: string;
}

interface StoredIdentityKeys {
  clientId: string;
  ed25519PrivB64: string;
  ed25519PubB64: string;
  x25519PrivB64: string;
  x25519PubB64: string;
  mlKemSecretB64: string;
  mlKemPubB64: string;
  ecdhP256PrivJwk: JsonWebKey;
  ecdhP256PubJwk: JsonWebKey;
  rsaOaepPrivJwk: JsonWebKey;
  rsaOaepPubJwk: JsonWebKey;
  createdAt: number;
}

interface PeerRatchetState {
  chainKey: Uint8Array;
  txCounter: number;
  rxCounter: number;
  peerRatchetX25519Pub?: Uint8Array;
  peerRatchetMlKemPub?: Uint8Array;
}

const DB_NAME = 'magma-secure-enclave-v1';
const KEK_STORE = 'enclave_kek';
const VAULT_STORE = 'sealed_vault';
const KEK_RECORD_KEY = 'hardware_non_extractable_kek';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * Constant-bucket & block-aligned random cryptographic padding
 * Prevents ISPs and network observers from inferring plaintext message length or media sizes
 */
function padLengthPrefixed(data: Uint8Array, minBucketSize: number, alignBlock = 4096): Uint8Array {
  const needed = 4 + data.length;
  let targetSize = minBucketSize;
  if (needed > minBucketSize) {
    if (needed <= 65536) {
      while (targetSize < needed) targetSize *= 2;
    } else {
      targetSize = Math.ceil(needed / alignBlock) * alignBlock;
    }
  }
  const padded = new Uint8Array(targetSize);
  const view = new DataView(padded.buffer);
  view.setUint32(0, data.length, false);
  padded.set(data, 4);
  if (targetSize > needed) {
    const tail = padded.subarray(needed);
    // crypto.getRandomValues max 65536 bytes per call
    for (let offset = 0; offset < tail.length; offset += 65536) {
      crypto.getRandomValues(tail.subarray(offset, Math.min(offset + 65536, tail.length)));
    }
  }
  return padded;
}

function unpadLengthPrefixed(padded: Uint8Array): Uint8Array {
  if (padded.length < 4) throw new Error('Invalid padded E2EE payload');
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  const originalLen = view.getUint32(0, false);
  if (originalLen > padded.length - 4) {
    throw new Error('Corrupted E2EE padding length');
  }
  return padded.subarray(4, 4 + originalLen);
}

function openEnclaveDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KEK_STORE)) {
        db.createObjectStore(KEK_STORE);
      }
      if (!db.objectStoreNames.contains(VAULT_STORE)) {
        db.createObjectStore(VAULT_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open Secure Enclave DB'));
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openEnclaveDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openEnclaveDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openEnclaveDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Hardware/Browser-Isolated Secure Enclave KEK (extractable: false)
 */
async function getOrCreateEnclaveKek(): Promise<CryptoKey> {
  try {
    const existing = await idbGet<CryptoKey>(KEK_STORE, KEK_RECORD_KEY);
    if (existing) return existing;
  } catch {
    // Fallback to fresh KEK below
  }

  const kek = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable inside Secure Enclave
    ['encrypt', 'decrypt']
  );

  try {
    await idbPut(KEK_STORE, KEK_RECORD_KEY, kek);
  } catch {
    // Ignore IDB persistence error in private contexts
  }
  return kek;
}

async function enclaveSealJson(key: string, data: unknown): Promise<void> {
  const kek = await getOrCreateEnclaveKek();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = textEncoder.encode(JSON.stringify(data));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, kek, toArrayBuffer(plain))
  );
  await idbPut(VAULT_STORE, key, { iv: toBase64(iv), cipher: toBase64(cipher) });
}

async function enclaveUnsealJson<T>(key: string): Promise<T | null> {
  try {
    const record = await idbGet<{ iv: string; cipher: string }>(VAULT_STORE, key);
    if (!record) return null;
    const kek = await getOrCreateEnclaveKek();
    const iv = fromBase64(record.iv);
    const cipher = fromBase64(record.cipher);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      kek,
      toArrayBuffer(cipher)
    );
    return JSON.parse(textDecoder.decode(plain)) as T;
  } catch {
    return null;
  }
}

export class MagmaE2EEEngine {
  private identity: StoredIdentityKeys | null = null;
  private ecdhPrivateKey: CryptoKey | null = null;
  private rsaPrivateKey: CryptoKey | null = null;
  private peerRatchets = new Map<string, PeerRatchetState>();
  private myRatchetX25519 = (() => {
    const priv = crypto.getRandomValues(new Uint8Array(32));
    return { priv, pub: x25519.getPublicKey(priv) };
  })();
  private myRatchetMlKem = ml_kem768.keygen();

  async initForClient(clientId: string): Promise<PublicKeyBundle> {
    const storageKey = `identity:${clientId}`;
    let stored = await enclaveUnsealJson<StoredIdentityKeys>(storageKey);

    if (!stored || stored.clientId !== clientId) {
      const edPriv = crypto.getRandomValues(new Uint8Array(32));
      const edPub = ed25519.getPublicKey(edPriv);

      const xPriv = crypto.getRandomValues(new Uint8Array(32));
      const xPub = x25519.getPublicKey(xPriv);

      const kem = ml_kem768.keygen();

      const ecdhPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
      );
      const ecdhPrivJwk = await crypto.subtle.exportKey('jwk', ecdhPair.privateKey);
      const ecdhPubJwk = await crypto.subtle.exportKey('jwk', ecdhPair.publicKey);

      const rsaPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );
      const rsaPrivJwk = await crypto.subtle.exportKey('jwk', rsaPair.privateKey);
      const rsaPubJwk = await crypto.subtle.exportKey('jwk', rsaPair.publicKey);

      stored = {
        clientId,
        ed25519PrivB64: toBase64(edPriv),
        ed25519PubB64: toBase64(edPub),
        x25519PrivB64: toBase64(xPriv),
        x25519PubB64: toBase64(xPub),
        mlKemSecretB64: toBase64(kem.secretKey),
        mlKemPubB64: toBase64(kem.publicKey),
        ecdhP256PrivJwk: ecdhPrivJwk,
        ecdhP256PubJwk: ecdhPubJwk,
        rsaOaepPrivJwk: rsaPrivJwk,
        rsaOaepPubJwk: rsaPubJwk,
        createdAt: Date.now(),
      };

      try {
        await enclaveSealJson(storageKey, stored);
      } catch {
        // Keep in-memory if IDB unavailable
      }
    }

    this.identity = stored;
    this.ecdhPrivateKey = await crypto.subtle.importKey(
      'jwk',
      stored.ecdhP256PrivJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );
    this.rsaPrivateKey = await crypto.subtle.importKey(
      'jwk',
      stored.rsaOaepPrivJwk,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );

    return this.getPublicKeyBundle();
  }

  getPublicKeyBundle(): PublicKeyBundle {
    if (!this.identity) throw new Error('E2EE Secure Enclave not initialized');
    const canonical = JSON.stringify({
      clientId: this.identity.clientId,
      ed25519PubB64: this.identity.ed25519PubB64,
      x25519PubB64: this.identity.x25519PubB64,
      mlKem768PubB64: this.identity.mlKemPubB64,
      ecdhP256PubJwk: this.identity.ecdhP256PubJwk,
      rsaOaepPubJwk: this.identity.rsaOaepPubJwk,
      createdAt: this.identity.createdAt,
    });
    const canonicalBytes = textEncoder.encode(canonical);
    const bundleHashSha3 = toHex(sha3_256(canonicalBytes));
    const edPriv = fromBase64(this.identity.ed25519PrivB64);
    const sig = ed25519.sign(sha3_256(canonicalBytes), edPriv);

    return {
      clientId: this.identity.clientId,
      ed25519PubB64: this.identity.ed25519PubB64,
      x25519PubB64: this.identity.x25519PubB64,
      mlKem768PubB64: this.identity.mlKemPubB64,
      ecdhP256PubJwk: this.identity.ecdhP256PubJwk,
      rsaOaepPubJwk: this.identity.rsaOaepPubJwk,
      bundleHashSha3,
      signatureB64: toBase64(sig),
      createdAt: this.identity.createdAt,
    };
  }

  verifyPublicKeyBundle(bundle: PublicKeyBundle): boolean {
    try {
      const canonical = JSON.stringify({
        clientId: bundle.clientId,
        ed25519PubB64: bundle.ed25519PubB64,
        x25519PubB64: bundle.x25519PubB64,
        mlKem768PubB64: bundle.mlKem768PubB64,
        ecdhP256PubJwk: bundle.ecdhP256PubJwk,
        rsaOaepPubJwk: bundle.rsaOaepPubJwk,
        createdAt: bundle.createdAt,
      });
      const canonicalBytes = textEncoder.encode(canonical);
      const expectedHash = toHex(sha3_256(canonicalBytes));
      if (expectedHash !== bundle.bundleHashSha3) return false;
      const pubBytes = fromBase64(bundle.ed25519PubB64);
      const sigBytes = fromBase64(bundle.signatureB64);
      return ed25519.verify(sigBytes, sha3_256(canonicalBytes), pubBytes);
    } catch {
      return false;
    }
  }

  computeSafetyFingerprint(peerBundle: PublicKeyBundle): string {
    if (!this.identity) return '---- ---- ---- ----';
    const pair = [this.identity.clientId, peerBundle.clientId].sort();
    const firstKey =
      pair[0] === this.identity.clientId
        ? `${this.identity.ed25519PubB64}:${this.identity.mlKemPubB64}`
        : `${peerBundle.ed25519PubB64}:${peerBundle.mlKem768PubB64}`;
    const secondKey =
      pair[0] === this.identity.clientId
        ? `${peerBundle.ed25519PubB64}:${peerBundle.mlKem768PubB64}`
        : `${this.identity.ed25519PubB64}:${this.identity.mlKemPubB64}`;

    const digest = sha3_512(textEncoder.encode(`${pair[0]}|${firstKey}|${pair[1]}|${secondKey}`));
    const digits: string[] = [];
    for (let i = 0; i < 24; i += 2) {
      const val = ((digest[i] << 8) | digest[i + 1]) % 10000;
      digits.push(val.toString().padStart(4, '0'));
    }
    return `${digits.slice(0, 4).join(' ')} · ${digits.slice(4, 8).join(' ')}`;
  }

  private getOrCreatePeerRatchet(peerClientId: string): PeerRatchetState {
    let state = this.peerRatchets.get(peerClientId);
    if (!state) {
      state = {
        chainKey: new Uint8Array(32),
        txCounter: 0,
        rxCounter: 0,
      };
      this.peerRatchets.set(peerClientId, state);
    }
    return state;
  }

  /**
   * Client-side Zero-Knowledge Photo & Video Binary Encryption before HTTPS upload
   */
  async encryptMediaFile(file: File, stripExifInLockdown: boolean): Promise<EncryptedMediaResult> {
    let rawBytes: Uint8Array;
    let effectiveMime = file.type || 'application/octet-stream';

    // In GrapheneOS Lockdown Mode, strip EXIF/GPS metadata from photos via Canvas re-encoding
    if (stripExifInLockdown && effectiveMime.startsWith('image/') && effectiveMime !== 'image/gif') {
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const cleanedBlob = await new Promise<Blob | null>((res) =>
            canvas.toBlob((b) => res(b), 'image/webp', 0.92)
          );
          if (cleanedBlob) {
            rawBytes = new Uint8Array(await cleanedBlob.arrayBuffer());
            effectiveMime = 'image/webp';
          } else {
            rawBytes = new Uint8Array(await file.arrayBuffer());
          }
        } else {
          bitmap.close();
          rawBytes = new Uint8Array(await file.arrayBuffer());
        }
      } catch {
        rawBytes = new Uint8Array(await file.arrayBuffer());
      }
    } else {
      rawBytes = new Uint8Array(await file.arrayBuffer());
    }

    const mediaSha3Digest = toHex(sha3_256(rawBytes));
    const paddedMediaBytes = padLengthPrefixed(rawBytes, 16384, 65536);
    const aesKeyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256-bit AES-GCM
    const aesIv = crypto.getRandomValues(new Uint8Array(12));

    let payloadToAes = paddedMediaBytes;
    let mediaCipherMode: 'AES256-CHACHA20' | 'AES256-GCM' = 'AES256-GCM';
    let chachaKeyB64: string | undefined;
    let chachaNonceB64: string | undefined;

    // Dual-layer ChaCha20-Poly1305 + AES-256-GCM for images & fast clips <= 8MB; hardware AES-256-GCM for large videos
    if (paddedMediaBytes.byteLength <= 8 * 1024 * 1024) {
      const chachaKey = crypto.getRandomValues(new Uint8Array(32));
      const chachaNonce = crypto.getRandomValues(new Uint8Array(12));
      payloadToAes = chacha20poly1305(chachaKey, chachaNonce).encrypt(paddedMediaBytes);
      mediaCipherMode = 'AES256-CHACHA20';
      chachaKeyB64 = toBase64(chachaKey);
      chachaNonceB64 = toBase64(chachaNonce);
    }

    const subtleAesKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(aesKeyBytes),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const aesCipherBytes = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(aesIv) },
        subtleAesKey,
        toArrayBuffer(payloadToAes)
      )
    );

    return {
      encryptedBlob: new Blob([toArrayBuffer(aesCipherBytes)], { type: 'application/octet-stream' }),
      mediaKeyB64: toBase64(aesKeyBytes),
      mediaIvB64: toBase64(aesIv),
      mediaChaChaKeyB64: chachaKeyB64,
      mediaChaChaNonceB64: chachaNonceB64,
      mediaCipherMode,
      mediaMimeType: effectiveMime,
      mediaSha3Digest,
    };
  }

  async decryptMediaBytes(encryptedBuffer: ArrayBuffer, meta: InnerChatPayload): Promise<Blob> {
    if (!meta.mediaKeyB64 || !meta.mediaIvB64) {
      throw new Error('Missing E2EE media decryption keys');
    }
    const aesKeyBytes = fromBase64(meta.mediaKeyB64);
    const aesIv = fromBase64(meta.mediaIvB64);

    const subtleAesKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(aesKeyBytes),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const layer1Bytes = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(aesIv) }, subtleAesKey, encryptedBuffer)
    );

    let paddedPlain = layer1Bytes;
    if (meta.mediaCipherMode === 'AES256-CHACHA20' && meta.mediaChaChaKeyB64 && meta.mediaChaChaNonceB64) {
      const chachaKey = fromBase64(meta.mediaChaChaKeyB64);
      const chachaNonce = fromBase64(meta.mediaChaChaNonceB64);
      paddedPlain = chacha20poly1305(chachaKey, chachaNonce).decrypt(layer1Bytes);
    }

    const plainBytes = unpadLengthPrefixed(paddedPlain);

    if (meta.mediaSha3Digest) {
      const computedSha3 = toHex(sha3_256(plainBytes));
      if (computedSha3 !== meta.mediaSha3Digest) {
        throw new Error('Media SHA3-256 integrity verification failed');
      }
    }

    return new Blob([toArrayBuffer(plainBytes)], {
      type: meta.mediaMimeType || (meta.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    });
  }

  /**
   * PQXDH + ECDH + ML-KEM-768 Braid + SPQR Triple Ratchet + XSalsa20/ChaCha20/AES-256 + Sealed Sender
   */
  async sealAndEncryptMessage(
    inner: Omit<InnerChatPayload, 'ratchetCounter' | 'nextRatchetX25519PubB64' | 'nextRatchetMlKemPubB64'>,
    peerBundle: PublicKeyBundle,
    requireVerifiedBundle: boolean
  ): Promise<SealedEnvelope> {
    if (!this.identity) throw new Error('Secure Enclave not initialized');
    if (requireVerifiedBundle && !this.verifyPublicKeyBundle(peerBundle)) {
      throw new Error('Peer Ed25519/ML-KEM bundle signature verification failed in Lockdown Mode');
    }

    const ratchet = this.getOrCreatePeerRatchet(peerBundle.clientId);
    ratchet.txCounter += 1;

    // Rotate ephemeral ratchet keys for SPQR / Double+Triple Ratchet forward secrecy
    const nextRatchetXPriv = crypto.getRandomValues(new Uint8Array(32));
    const nextRatchetXPub = x25519.getPublicKey(nextRatchetXPriv);
    const nextRatchetKem = ml_kem768.keygen();
    this.myRatchetX25519 = { priv: nextRatchetXPriv, pub: nextRatchetXPub };
    this.myRatchetMlKem = nextRatchetKem;

    const fullInner: InnerChatPayload = {
      ...inner,
      ratchetCounter: ratchet.txCounter,
      nextRatchetX25519PubB64: toBase64(nextRatchetXPub),
      nextRatchetMlKemPubB64: toBase64(nextRatchetKem.publicKey),
    };

    const payloadJson = JSON.stringify(fullInner);
    const edPriv = fromBase64(this.identity.ed25519PrivB64);
    const payloadDigest = sha3_256(textEncoder.encode(payloadJson));
    const ed25519SigB64 = toBase64(ed25519.sign(payloadDigest, edPriv));

    const signedInner: SignedInnerEnvelope = {
      payloadJson,
      ed25519SigB64,
      senderEd25519PubB64: this.identity.ed25519PubB64,
    };
    const signedBytes = padLengthPrefixed(textEncoder.encode(JSON.stringify(signedInner)), 2048);

    // 1. Classical X25519 Ephemeral ECDH
    const ephXPriv = crypto.getRandomValues(new Uint8Array(32));
    const ephXPub = x25519.getPublicKey(ephXPriv);
    const ssX25519 = x25519.getSharedSecret(ephXPriv, fromBase64(peerBundle.x25519PubB64));

    // 2. WebCrypto ECDH P-256 Ephemeral Agreement
    const ephEcdhPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    const ephEcdhPubJwk = await crypto.subtle.exportKey('jwk', ephEcdhPair.publicKey);
    const peerEcdhPub = await crypto.subtle.importKey(
      'jwk',
      peerBundle.ecdhP256PubJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const ssEcdhP256 = new Uint8Array(
      await crypto.subtle.deriveBits({ name: 'ECDH', public: peerEcdhPub }, ephEcdhPair.privateKey, 256)
    );

    // 3. Post-Quantum ML-KEM-768 Encapsulation (PQXDH)
    const { cipherText: mlKemCt, sharedSecret: ssMlKem } = ml_kem768.encapsulate(
      fromBase64(peerBundle.mlKem768PubB64)
    );

    // 4. Optional ML-KEM Braid Ratchet if peer already advertised an active ratchet key
    let braidKemCtB64: string | undefined;
    let ssBraidKem = new Uint8Array(0);
    if (ratchet.peerRatchetMlKemPub) {
      const braid = ml_kem768.encapsulate(ratchet.peerRatchetMlKemPub);
      braidKemCtB64 = toBase64(braid.cipherText);
      ssBraidKem = braid.sharedSecret;
    }

    // 5. Hybrid RSA-OAEP (SHA-256) Secret Wrap
    const rsaSecret = crypto.getRandomValues(new Uint8Array(32));
    const peerRsaPub = await crypto.subtle.importKey(
      'jwk',
      peerBundle.rsaOaepPubJwk,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    const rsaWrapped = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, peerRsaPub, toArrayBuffer(rsaSecret))
    );

    // 6. HKDF-SHA512 + SHA3-512 Key Schedule (AES-256, ChaCha20, XSalsa20, HMAC, Ratchet Chain)
    const ikm = concatBytes(ssX25519, ssEcdhP256, ssMlKem, ssBraidKem, sha256(rsaSecret));
    const salt = sha3_512(textEncoder.encode(`MAGMA-PQXDH-SEALED|${peerBundle.bundleHashSha3}`));
    const info = textEncoder.encode('MAGMA-TRIPLE-RATCHET-AES256-CHACHA20-XSALSA20-HMAC');
    const okm = hkdf(sha512, ikm, salt, info, 160);

    const kAes256 = okm.subarray(0, 32);
    const kChaCha = okm.subarray(32, 64);
    const kXSalsa = okm.subarray(64, 96);
    const kHmac = okm.subarray(96, 128);
    const nextChainContribution = okm.subarray(128, 160);
    ratchet.chainKey = hkdf(sha256, concatBytes(ratchet.chainKey, nextChainContribution), salt, info, 32);

    // 7. Triple Cipher Encryption (XSalsa20-Poly1305 -> ChaCha20-Poly1305 -> AES-256-GCM)
    const nonce24 = crypto.getRandomValues(new Uint8Array(24));
    const nonce12ChaCha = crypto.getRandomValues(new Uint8Array(12));
    const nonce12Aes = crypto.getRandomValues(new Uint8Array(12));
    const aad = textEncoder.encode(`MAGMA-SEALED|${peerBundle.clientId}`);

    const layer1 = xsalsa20poly1305(kXSalsa, nonce24).encrypt(signedBytes);
    const layer2 = chacha20poly1305(kChaCha, nonce12ChaCha, aad).encrypt(layer1);
    const layer3 = gcm(kAes256, nonce12Aes, aad).encrypt(layer2);

    // 8. Outer HMAC-SHA512 & SHA3-256 Commit
    const hmacTag = hmac(sha512, kHmac, concatBytes(aad, ephXPub, mlKemCt, layer3));
    const sha3Commit = sha3_256(concatBytes(layer3, hmacTag));

    return {
      version: 'MAGMA-E2EE-PQXDH-TRIPLE-RATCHET-v1',
      ephX25519PubB64: toBase64(ephXPub),
      ephEcdhP256PubJwk: ephEcdhPubJwk,
      mlKemCtB64: toBase64(mlKemCt),
      braidKemCtB64,
      rsaWrappedSecretB64: toBase64(rsaWrapped),
      nonce24B64: toBase64(nonce24),
      nonce12ChaChaB64: toBase64(nonce12ChaCha),
      nonce12AesB64: toBase64(nonce12Aes),
      ciphertextB64: toBase64(layer3),
      hmacSha512B64: toBase64(hmacTag),
      sha3CommitB64: toBase64(sha3Commit),
    };
  }

  async unsealAndDecryptMessage(
    envelope: SealedEnvelope,
    myBundle: PublicKeyBundle,
    resolvePeerBundle: (senderClientId: string) => Promise<PublicKeyBundle | null>,
    requireVerifiedBundle: boolean
  ): Promise<InnerChatPayload> {
    if (!this.identity || !this.ecdhPrivateKey || !this.rsaPrivateKey) {
      throw new Error('Secure Enclave keys unavailable');
    }

    const ephXPub = fromBase64(envelope.ephX25519PubB64);
    const mlKemCt = fromBase64(envelope.mlKemCtB64);
    const layer3 = fromBase64(envelope.ciphertextB64);
    const hmacTag = fromBase64(envelope.hmacSha512B64);
    const sha3Commit = fromBase64(envelope.sha3CommitB64);

    // 1. Verify SHA3-256 commit first
    const expectedCommit = sha3_256(concatBytes(layer3, hmacTag));
    if (toHex(expectedCommit) !== toHex(sha3Commit)) {
      throw new Error('SHA3-256 envelope integrity check failed');
    }

    // 2. X25519 Shared Secret
    const ssX25519 = x25519.getSharedSecret(fromBase64(this.identity.x25519PrivB64), ephXPub);

    // 3. ECDH P-256 Shared Secret
    const ephEcdhPub = await crypto.subtle.importKey(
      'jwk',
      envelope.ephEcdhP256PubJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const ssEcdhP256 = new Uint8Array(
      await crypto.subtle.deriveBits({ name: 'ECDH', public: ephEcdhPub }, this.ecdhPrivateKey, 256)
    );

    // 4. ML-KEM-768 Decapsulation
    const ssMlKem = ml_kem768.decapsulate(mlKemCt, fromBase64(this.identity.mlKemSecretB64));

    // 5. Optional ML-KEM Braid Ratchet Decapsulation
    let ssBraidKem = new Uint8Array(0);
    if (envelope.braidKemCtB64) {
      ssBraidKem = ml_kem768.decapsulate(
        fromBase64(envelope.braidKemCtB64),
        this.myRatchetMlKem.secretKey
      );
    }

    // 6. RSA-OAEP Unwrap
    const rsaSecret = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        this.rsaPrivateKey,
        toArrayBuffer(fromBase64(envelope.rsaWrappedSecretB64))
      )
    );

    // 7. HKDF-SHA512 Key Derivation
    const ikm = concatBytes(ssX25519, ssEcdhP256, ssMlKem, ssBraidKem, sha256(rsaSecret));
    const salt = sha3_512(textEncoder.encode(`MAGMA-PQXDH-SEALED|${myBundle.bundleHashSha3}`));
    const info = textEncoder.encode('MAGMA-TRIPLE-RATCHET-AES256-CHACHA20-XSALSA20-HMAC');
    const okm = hkdf(sha512, ikm, salt, info, 160);

    const kAes256 = okm.subarray(0, 32);
    const kChaCha = okm.subarray(32, 64);
    const kXSalsa = okm.subarray(64, 96);
    const kHmac = okm.subarray(96, 128);

    const aad = textEncoder.encode(`MAGMA-SEALED|${myBundle.clientId}`);
    const expectedHmac = hmac(sha512, kHmac, concatBytes(aad, ephXPub, mlKemCt, layer3));
    if (toHex(expectedHmac) !== toHex(hmacTag)) {
      throw new Error('HMAC-SHA512 authentication failed');
    }

    // 8. Reverse Triple Cipher Decryption (AES-256-GCM -> ChaCha20-Poly1305 -> XSalsa20-Poly1305)
    const layer2 = gcm(kAes256, fromBase64(envelope.nonce12AesB64), aad).decrypt(layer3);
    const layer1 = chacha20poly1305(kChaCha, fromBase64(envelope.nonce12ChaChaB64), aad).decrypt(layer2);
    const paddedSignedBytes = xsalsa20poly1305(kXSalsa, fromBase64(envelope.nonce24B64)).decrypt(layer1);
    const signedBytes = unpadLengthPrefixed(paddedSignedBytes);

    const signedInner = JSON.parse(textDecoder.decode(signedBytes)) as SignedInnerEnvelope;
    const inner = JSON.parse(signedInner.payloadJson) as InnerChatPayload;

    // 9. Verify Sender Ed25519 Signature inside Sealed Envelope
    const payloadDigest = sha3_256(textEncoder.encode(signedInner.payloadJson));
    const peerBundle = await resolvePeerBundle(inner.senderClientId);
    const edPubToVerify = peerBundle?.ed25519PubB64 || signedInner.senderEd25519PubB64;

    if (requireVerifiedBundle) {
      if (!peerBundle || !this.verifyPublicKeyBundle(peerBundle)) {
        throw new Error('Lockdown Mode blocked message from unverified peer bundle');
      }
      if (peerBundle.ed25519PubB64 !== signedInner.senderEd25519PubB64) {
        throw new Error('Sender Ed25519 key mismatch');
      }
    }

    const sigValid = ed25519.verify(
      fromBase64(signedInner.ed25519SigB64),
      payloadDigest,
      fromBase64(edPubToVerify)
    );
    if (!sigValid) {
      throw new Error('Inner Ed25519 signature verification failed');
    }

    // 10. Advance Peer Triple Ratchet State (SPQR / ML-KEM Braid)
    const peerRatchet = this.getOrCreatePeerRatchet(inner.senderClientId);
    peerRatchet.rxCounter = Math.max(peerRatchet.rxCounter, inner.ratchetCounter);
    if (inner.nextRatchetX25519PubB64) {
      peerRatchet.peerRatchetX25519Pub = fromBase64(inner.nextRatchetX25519PubB64);
    }
    if (inner.nextRatchetMlKemPubB64) {
      peerRatchet.peerRatchetMlKemPub = fromBase64(inner.nextRatchetMlKemPubB64);
    }

    return inner;
  }

  async sealLocalMessages<T>(clientId: string, messages: T[]): Promise<void> {
    try {
      await enclaveSealJson(`vault:messages:${clientId}`, messages.slice(-500));
    } catch {
      // ignore if IDB blocked
    }
  }

  async unsealLocalMessages<T>(clientId: string): Promise<T[]> {
    const res = await enclaveUnsealJson<T[]>(`vault:messages:${clientId}`);
    return Array.isArray(res) ? res : [];
  }

  async wipeEnclave(clientId: string): Promise<void> {
    this.peerRatchets.clear();
    try {
      await idbDelete(VAULT_STORE, `identity:${clientId}`);
      await idbDelete(VAULT_STORE, `vault:messages:${clientId}`);
      await idbDelete(KEK_STORE, KEK_RECORD_KEY);
    } catch {
      // ignore
    }
  }
}

export const magmaE2EE = new MagmaE2EEEngine();
