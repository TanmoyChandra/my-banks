const SECRET_LOCAL_KEY = "MB_LOCAL_PERSIST_KEY_998877";

/**
 * Encrypts a string by XORing with a key and converting to Hex.
 * Safe for all character ranges.
 */
export const encryptLocal = (text: string): string => {
  if (!text) return "";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const xor = text.charCodeAt(i) ^ SECRET_LOCAL_KEY.charCodeAt(i % SECRET_LOCAL_KEY.length);
    // Convert to 4-digit hex to handle full 16-bit characters safely
    result += xor.toString(16).padStart(4, '0');
  }
  return result;
};

/**
 * Decrypts a Hex string back to the original string.
 */
export const decryptLocal = (cipher: string): string => {
  if (!cipher) return "";
  try {
    let result = "";
    for (let i = 0; i < cipher.length; i += 4) {
      const hex = cipher.substring(i, i + 4);
      const xor = parseInt(hex, 16);
      result += String.fromCharCode(xor ^ SECRET_LOCAL_KEY.charCodeAt((i / 4) % SECRET_LOCAL_KEY.length));
    }
    return result;
  } catch (e) {
    console.error("Failed to decrypt local data", e);
    return "";
  }
};
