/* 
  TaskFlow Zero-Knowledge End-to-End Encryption Engine
  Uses Web Crypto API (SubtleCrypto) with PBKDF2 & AES-256-GCM
*/

// Convert ArrayBuffer to Hex string
function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert Hex string to Uint8Array
function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Convert String to Uint8Array (UTF-8)
function strToBuf(str) {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to String (UTF-8)
function bufToStr(buf) {
  return new TextDecoder().decode(buf);
}

// Generate random salt for PBKDF2
export function generateSalt() {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufToHex(salt);
}

// Derive AES-256 Key from password and salt using PBKDF2
export async function deriveKeyFromPassword(password, saltHex) {
  const passwordBuf = strToBuf(password);
  const saltBuf = hexToBuf(saltHex);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuf,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );

  return derivedKey;
}

// Generate random 256-bit AES Master Key
export async function generateMasterKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

// Generate readable 24-character Recovery Key (formatted in 4-char groups)
export function generateRecoveryKey() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(12));
  const hex = bufToHex(bytes).toUpperCase();
  // Format as A4B8-9F22-C110-E7D3-488B-62FA
  return hex.match(/.{1,4}/g).join("-");
}

// Wrap (encrypt) Master Key using a derived key (Password derived or Recovery derived)
export async function wrapMasterKey(masterKey, wrappingKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedBuffer = await window.crypto.subtle.wrapKey(
    "raw",
    masterKey,
    wrappingKey,
    { name: "AES-GCM", iv }
  );

  return JSON.stringify({
    iv: bufToHex(iv),
    ciphertext: bufToHex(wrappedBuffer)
  });
}

// Unwrap (decrypt) Master Key using a derived key
export async function unwrapMasterKey(wrappedKeyJson, unwrappingKey) {
  const { iv, ciphertext } = JSON.parse(wrappedKeyJson);
  const ivBuf = hexToBuf(iv);
  const ciphertextBuf = hexToBuf(ciphertext);

  const masterKey = await window.crypto.subtle.unwrapKey(
    "raw",
    ciphertextBuf,
    unwrappingKey,
    { name: "AES-GCM", iv: ivBuf },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return masterKey;
}

// Encrypt plaintext string with Master Key -> "enc:v1:<iv>:<ciphertext>"
export async function encryptText(text, masterKey) {
  if (text === null || text === undefined || text === "") return text;
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const textBuf = strToBuf(String(text));

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    textBuf
  );

  return `enc:v1:${bufToHex(iv)}:${bufToHex(encryptedBuf)}`;
}

// Decrypt ciphertext string with Master Key
export async function decryptText(cipherString, masterKey) {
  if (!cipherString || typeof cipherString !== "string") return cipherString;
  if (!cipherString.startsWith("enc:v1:")) return cipherString; // Return legacy plaintext as-is

  try {
    const parts = cipherString.split(":");
    if (parts.length !== 4) return cipherString;

    const ivHex = parts[2];
    const cipherHex = parts[3];

    const ivBuf = hexToBuf(ivHex);
    const cipherBuf = hexToBuf(cipherHex);

    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuf },
      masterKey,
      cipherBuf
    );

    return bufToStr(decryptedBuf);
  } catch (err) {
    console.error("Failed to decrypt text:", err);
    return "[Decryption Error]";
  }
}

// Export raw master key to Base64 for session storage
export async function exportMasterKeyRaw(masterKey) {
  const exported = await window.crypto.subtle.exportKey("raw", masterKey);
  return bufToHex(exported);
}

// Import raw master key from Base64 from session storage
export async function importMasterKeyRaw(hexString) {
  const rawBuf = hexToBuf(hexString);
  return await window.crypto.subtle.importKey(
    "raw",
    rawBuf,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
