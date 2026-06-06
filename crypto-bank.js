const BANK_PASSPHRASE_SESSION_KEY = 'neet-bank-passphrase-v1';

function getPrivateConfig() {
  return window.APP_PRIVATE || {};
}

function getStoredBankPassphrase() {
  return (
    sessionStorage.getItem(BANK_PASSPHRASE_SESSION_KEY) ||
    getPrivateConfig().bankPassphrase ||
    ''
  );
}

function setStoredBankPassphrase(value) {
  if (value) sessionStorage.setItem(BANK_PASSPHRASE_SESSION_KEY, value);
  else sessionStorage.removeItem(BANK_PASSPHRASE_SESSION_KEY);
}

function bankNeedsPassphrase() {
  const config = getAppConfig();
  return Boolean(config.bankEncrypted) && !getStoredBankPassphrase();
}

async function deriveBankKey(passphrase, saltBytes, iterations) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function decryptBankEnvelope(encryptedEnvelope, passphrase) {
  if (!encryptedEnvelope || encryptedEnvelope.alg !== 'AES-GCM') {
    throw new Error('Encrypted bank file format is not supported.');
  }
  if (!passphrase) {
    throw new Error('Bank unlock passphrase is required.');
  }

  const salt = base64ToBytes(encryptedEnvelope.salt);
  const iv = base64ToBytes(encryptedEnvelope.iv);
  const ciphertext = base64ToBytes(encryptedEnvelope.ciphertext);
  const key = await deriveBankKey(passphrase, salt, encryptedEnvelope.iterations || 100000);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoded = new TextDecoder().decode(plainBuffer);
  return JSON.parse(decoded);
}

async function parseDownloadedBank(rawData, passphrase) {
  const config = getAppConfig();
  if (config.bankEncrypted || (rawData && rawData.alg === 'AES-GCM')) {
    return decryptBankEnvelope(rawData, passphrase || getStoredBankPassphrase());
  }
  return rawData;
}
