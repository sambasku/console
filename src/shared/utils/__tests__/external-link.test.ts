import { describe, expect, it } from 'vitest';
import { isOwnHost, withSambaskuUtm } from '../external-link';

describe('withSambaskuUtm', () => {
  it('tambah utm_source + utm_medium ke link https', () => {
    expect(withSambaskuUtm('https://facebook.com/pawai')).toBe(
      'https://facebook.com/pawai?utm_source=sambasku.com&utm_medium=referral',
    );
  });

  it('skip link bukan https', () => {
    expect(withSambaskuUtm('http://facebook.com/pawai')).toBe('http://facebook.com/pawai');
    expect(withSambaskuUtm('sambasku://deeplink')).toBe('sambasku://deeplink');
  });

  it('skip domain sendiri', () => {
    expect(withSambaskuUtm('https://sambasku.com/kamus')).toBe('https://sambasku.com/kamus');
    expect(withSambaskuUtm('https://sambasku-staging.iamutaki.com/api')).toBe(
      'https://sambasku-staging.iamutaki.com/api',
    );
  });

  it('skip URL yang sudah punya utm_source (mis. Unsplash)', () => {
    const url = 'https://images.unsplash.com/photo?ixid=1&utm_source=sambasku';
    expect(withSambaskuUtm(url)).toBe(url);
  });

  it('query + hash asli tetap utuh', () => {
    expect(withSambaskuUtm('https://example.com/p?a=1#frag')).toBe(
      'https://example.com/p?a=1&utm_source=sambasku.com&utm_medium=referral#frag',
    );
  });

  it('URL tidak valid dikembalikan apa adanya', () => {
    expect(withSambaskuUtm('bukan url')).toBe('bukan url');
  });
});

describe('isOwnHost', () => {
  it('kenali domain sendiri + subdomain', () => {
    expect(isOwnHost('sambasku.com')).toBe(true);
    expect(isOwnHost('www.sambasku.com')).toBe(true);
    expect(isOwnHost('api.sambasku.com')).toBe(true);
    expect(isOwnHost('facebook.com')).toBe(false);
  });
});
