import { describe, expect, it } from 'vitest';
import { imageDataUrlToInlineData, MAX_IMAGE_BYTES } from '../image';

describe('AI image validation', () => {
  it('rejects an oversized image before Gemini', () => {
    const bytes = Buffer.alloc(MAX_IMAGE_BYTES + 1);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
    const image = `data:image/png;base64,${bytes.toString('base64')}`;

    expect(() => imageDataUrlToInlineData(image)).toThrow(/3145728 bytes/);
  });
});
