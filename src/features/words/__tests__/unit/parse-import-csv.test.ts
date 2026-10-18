import { describe, expect, it } from 'vitest';
import { importTemplateCsv, parseImportCsv, normalizeWordClassCode } from '@/features/words/application/parse-import-csv';

describe('normalizeWordClassCode', () => {
  it.each(['', 'kb', 'KK', '  ks  ', 'kd', 'kt'])('"%s" valid', (code) => {
    expect(normalizeWordClassCode(code)).toBe(code.trim().toLowerCase());
  });
  it('kosong tetap kosong (umum)', () => {
    expect(normalizeWordClassCode('')).toBe('');
  });
  it('tidak dikenal → null', () => {
    expect(normalizeWordClassCode('xx')).toBeNull();
    expect(normalizeWordClassCode('noun')).toBeNull();
  });
});

describe('parseImportCsv', () => {
  it('menggabungkan lemma yang sama menjadi beberapa makna', () => {
    const { words } = parseImportCsv(
      'lemma,terjemahan,definisi,contoh\nmakatn,makan,,\nMakatn,,menghabiskan,\n',
    );
    expect(words).toHaveLength(1);
    expect(words[0].meanings).toHaveLength(2);
    expect(words[0].lemma).toBe('makatn');
  });

  it('menerima header padanan dan arti serta koma di dalam kutip', () => {
    const { words } = parseImportCsv(
      'kata;padanan;arti;contoh\nayek;air;"cairan, untuk minum";\n',
    );
    expect(words[0].meanings[0]).toMatchObject({
      translation: 'air',
      definition: 'cairan, untuk minum',
    });
  });

  it('menerima header baru kata/penjelasan_arti', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,contoh\npalak,kepala,bagian tubuh sebelah atas,\n',
    );
    expect(words[0]).toMatchObject({ lemma: 'palak' });
    expect(words[0].meanings[0]).toMatchObject({
      translation: 'kepala',
      definition: 'bagian tubuh sebelah atas',
    });
  });

  it('menggabungkan makna kembar di file', () => {
    const { words } = parseImportCsv(
      'lemma,terjemahan,definisi,contoh\nmakatn,makan,,\nmakatn,makan,,\n',
    );
    expect(words[0].meanings).toHaveLength(1);
  });

  // --- 6 kolom ---
  it('6-kolom: wordClassCode dan exampleTranslation ter-ekstrak', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,type,contoh,arti_contoh\nmakatn,makan,mengurangi,kb,die makatn,dia makan\n',
    );
    expect(words).toHaveLength(1);
    expect(words[0].meanings[0]).toMatchObject({
      wordClassCode: 'kb',
      example: 'die makatn',
      exampleTranslation: 'dia makan',
    });
  });

  it('6-kolom: type kosong = umum (wordClassCode "")', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,type,contoh,arti_contoh\nmakatn,makan,mengurangi,,die makatn,dia makan\n',
    );
    expect(words[0].meanings[0].wordClassCode).toBe('');
  });

  it('6-kolom: case-insensitive type code', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,type,contoh,arti_contoh\nmakatn,makan,mengurangi,KK,die makatn,dia makan\n',
    );
    expect(words[0].meanings[0].wordClassCode).toBe('kk');
  });

  it('6-kolom: type alias word_class_code diterima', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,word_class_code,contoh,arti_contoh\nmakatn,makan,mengurangi,ks,die makatn,dia makan\n',
    );
    expect(words[0].meanings[0].wordClassCode).toBe('ks');
  });

  it('6-kolom: arti_contoh alias example_translation diterima', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,type,contoh,example_translation\nmakatn,makan,mengurangi,kd,die makatn,dia makan\n',
    );
    expect(words[0].meanings[0].exampleTranslation).toBe('dia makan');
  });

  // --- 4-kolom backward compat ---
  it('4-kolom: field baru kosong, backward compat tanpa throw', () => {
    const { words } = parseImportCsv(
      'kata,terjemahan,penjelasan_arti,contoh\nmakatn,makan,mengurangi,\n',
    );
    expect(words).toHaveLength(1);
    expect(words[0].meanings[0]).toMatchObject({
      wordClassCode: '',
      exampleTranslation: '',
    });
  });

  it('4-kolom header lemma/definisi juga backward compat', () => {
    const { words } = parseImportCsv(
      'lemma,terjemahan,definisi,contoh\nmakatn,makan,mengurangi,\n',
    );
    expect(words).toHaveLength(1);
    expect(words[0].meanings[0]).toMatchObject({
      wordClassCode: '',
      exampleTranslation: '',
    });
  });

  // --- validasi ---
  it('type tidak dikenal → throw dengan nomor baris', () => {
    expect(() =>
      parseImportCsv(
        'kata,terjemahan,penjelasan_arti,type,contoh,arti_contoh\nmakatn,makan,mengurangi,xx,,\n',
      ),
    ).toThrow(/Kode kelas kata "xx" di baris 2 tidak dikenal/);
  });

  it('type tidak dikenal di baris tengah → throw dengan baris benar', () => {
    expect(() =>
      parseImportCsv(
        'kata,terjemahan,penjelasan_arti,type,contoh,arti_contoh\nmakatn,makan,mengurangi,kb,,\nmakatn,makan,mengurangi2,xx,,\n',
      ),
    ).toThrow(/baris 3/);
  });

  // --- delimiter ---
  it('delimiter ; tetap bekerja', () => {
    const { words } = parseImportCsv('kata;terjemahan;penjelasan_arti;type;contoh;arti_contoh\nmakatn;makan;mengurangi;kk;die makatn;dia makan\n');
    expect(words[0].meanings[0].wordClassCode).toBe('kk');
  });

  // --- dedupe ---
  it('fingerprint dedupe tidak berubah (definition+translation)', () => {
    const csv =
      'lemma,terjemahan,definisi,type,contoh,arti_contoh\n' +
      'makatn,makan,def1,kb,,\n' +
      'makatn,makan,def1,kk,,\n'; // sama → dedupe
    const { words } = parseImportCsv(csv);
    expect(words[0].meanings).toHaveLength(1);
  });

  it('lemma sama, makna beda → gabung', () => {
    const csv =
      'lemma,terjemahan,definisi,type,contoh,arti_contoh\n' +
      'makatn,makan,def1,kb,,\n' +
      'makatn,makan,def2,kk,,\n';
    const { words } = parseImportCsv(csv);
    expect(words).toHaveLength(1);
    expect(words[0].meanings).toHaveLength(2);
  });
});

describe('importTemplateCsv', () => {
  it('templat baru 6-kolom', () => {
    const header = importTemplateCsv().split('\n')[0];
    expect(header).toBe('kata,terjemahan,penjelasan_arti,type,contoh,arti_contoh');
  });

  it('baris contoh mengisi type', () => {
    const rows = importTemplateCsv().split('\n');
    expect(rows[1]).toBe('makatn,makan,menghabiskan makanan,kb,die makatn,dia makan');
  });
});
