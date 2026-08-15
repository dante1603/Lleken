import { AiHttpError } from './errors.js';

// Keeps binary content below Vercel's request boundary after base64 and JSON overhead.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export interface InlineImage {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

function matchesDeclaredImageType(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}

export function imageDataUrlToInlineData(image: unknown): InlineImage {
  if (typeof image !== 'string') {
    throw new AiHttpError(400, 'INVALID_IMAGE', 'La imagen debe enviarse como data URL.');
  }

  const match = DATA_URL_PATTERN.exec(image.trim());
  if (!match) {
    throw new AiHttpError(400, 'INVALID_IMAGE', 'La imagen debe ser JPEG, PNG o WebP en base64.');
  }

  const [, mimeType, data] = match;
  if (data.length % 4 !== 0) {
    throw new AiHttpError(400, 'INVALID_IMAGE', 'El contenido base64 de la imagen no es valido.');
  }
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new AiHttpError(400, 'INVALID_IMAGE_SIZE', `La imagen debe pesar entre 1 byte y ${MAX_IMAGE_BYTES} bytes.`);
  }
  if (!matchesDeclaredImageType(bytes, mimeType)) {
    throw new AiHttpError(400, 'INVALID_IMAGE_CONTENT', 'El contenido de la imagen no coincide con el formato declarado.');
  }

  return { inlineData: { data, mimeType } };
}

export { MAX_IMAGE_BYTES };
