import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { client } from '../client';

describe('client FormData interceptor', () => {
  const originalAdapter = client.defaults.adapter;

  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it('menghapus Content-Type default JSON saat mengirim FormData', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null;
    client.defaults.adapter = (async (config) => {
      capturedConfig = config;
      return {
        data: { success: true, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) satisfies AxiosAdapter;

    const form = new FormData();
    form.append('image', new Blob(['img'], { type: 'image/webp' }), 'censored.webp');
    form.append('content_warnings', '[]');

    await client.post('/admin/explore-comments/place/c1/censor-image', form);

    expect(capturedConfig).not.toBeNull();
    expect(capturedConfig!.data).toBeInstanceOf(FormData);
    const contentType = capturedConfig!.headers.getContentType?.() ?? capturedConfig!.headers['Content-Type'];
    expect(String(contentType ?? '')).not.toContain('application/json');
  });

  it('mempertahankan Content-Type application/json untuk body JSON biasa', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null;
    client.defaults.adapter = (async (config) => {
      capturedConfig = config;
      return {
        data: { success: true, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) satisfies AxiosAdapter;

    await client.post('/admin/explore-comments/place/c1/censor-image', {
      content_warnings: [],
    });

    expect(capturedConfig).not.toBeNull();
    const contentType = capturedConfig!.headers.getContentType?.() ?? capturedConfig!.headers['Content-Type'];
    expect(String(contentType ?? '')).toContain('application/json');
  });
});
