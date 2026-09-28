import { useEffect, useState } from 'react';
import { Card, Flex, Input, Select, Typography } from 'antd';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { listAdminUsersRequest } from '@/features/users/infrastructure/user-admin-api';
import {
  listWordImportSessionsRequest,
  type WordImportSupportType,
} from '../infrastructure/word-api';

export type ImportSupportDraft = {
  name: string;
  type: WordImportSupportType | undefined;
  address: string;
  title: string;
  desc: string;
};

export const EMPTY_IMPORT_SUPPORT: ImportSupportDraft = {
  name: '',
  type: undefined,
  address: '',
  title: '',
  desc: '',
};

export const SUPPORT_TYPE_OPTIONS: { value: WordImportSupportType; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'book', label: 'Buku' },
  { value: 'article', label: 'Artikel' },
  { value: 'other', label: 'Lainnya' },
];

export const SUPPORT_TYPE_LABEL: Record<WordImportSupportType, string> = {
  web: 'Web',
  book: 'Buku',
  article: 'Artikel',
  other: 'Lainnya',
};

type UserOption = { value: string; label: string };
type HistoryOption = { value: string; label: string; draft: ImportSupportDraft };

/**
 * Form Data Pendukung (per batch) + pemilih user atribusi + isi dari riwayat.
 */
export function ImportAttributionFields({
  support,
  onSupportChange,
  attributedTo,
  onAttributedToChange,
  disabled,
}: {
  support: ImportSupportDraft;
  onSupportChange: (next: ImportSupportDraft) => void;
  attributedTo: string | undefined;
  onAttributedToChange: (userId: string | undefined) => void;
  disabled?: boolean;
}) {
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyOptions, setHistoryOptions] = useState<HistoryOption[]>([]);
  const debouncedUserSearch = useDebouncedValue(userSearch, 300);
  const debouncedHistorySearch = useDebouncedValue(historySearch, 300);

  useEffect(() => {
    let cancelled = false;
    listAdminUsersRequest({ q: debouncedUserSearch || undefined, limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setUserOptions(
          res.data.map((u) => ({
            value: u.id,
            label: `${u.username} (${u.email})`,
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debouncedUserSearch]);

  useEffect(() => {
    let cancelled = false;
    listWordImportSessionsRequest({
      q: debouncedHistorySearch || undefined,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setHistoryOptions(
          res.data
            .filter((s) => s.support_name || s.support_title || s.support_address)
            .map((s) => {
              const name = s.support_name || s.source_label || 'Tanpa nama';
              const typeLabel = s.support_type ? SUPPORT_TYPE_LABEL[s.support_type] : null;
              return {
                value: s.id,
                label: [name, typeLabel, s.support_title].filter(Boolean).join(' · '),
                draft: {
                  name: s.support_name ?? '',
                  type: s.support_type ?? undefined,
                  address: s.support_address ?? '',
                  title: s.support_title ?? '',
                  desc: s.support_desc ?? '',
                },
              };
            }),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debouncedHistorySearch]);

  const patch = (partial: Partial<ImportSupportDraft>) => {
    onSupportChange({ ...support, ...partial });
  };

  return (
    <Card
      size="small"
      title="Data Pendukung"
      style={{ marginBottom: 8 }}
      styles={{ body: { paddingTop: 12 } }}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 12, fontSize: 12 }}>
        Sitasi sumber data (situs, buku, artikel). Atribusi kata default ke Pengimpor Data CSV,
        kecuali Anda memilih user di bawah.
      </Typography.Paragraph>
      <Flex vertical gap={8}>
        <Select
          allowClear
          showSearch
          disabled={disabled}
          placeholder="Isi dari riwayat impor…"
          filterOption={false}
          options={historyOptions}
          searchValue={historySearch}
          onSearch={setHistorySearch}
          onChange={(id) => {
            const hit = historyOptions.find((o) => o.value === id);
            if (hit) onSupportChange(hit.draft);
          }}
          style={{ width: '100%' }}
        />
        <Flex gap={8} wrap>
          <Select
            allowClear
            disabled={disabled}
            placeholder="Tipe"
            options={SUPPORT_TYPE_OPTIONS}
            value={support.type}
            onChange={(type) => patch({ type })}
            style={{ width: 140 }}
          />
          <Input
            allowClear
            disabled={disabled}
            placeholder="Nama sumber (situs / penerbit)"
            value={support.name}
            onChange={(e) => patch({ name: e.target.value })}
            style={{ flex: '1 1 200px' }}
          />
        </Flex>
        <Input
          allowClear
          disabled={disabled}
          placeholder="Alamat (URL atau lokasi)"
          value={support.address}
          onChange={(e) => patch({ address: e.target.value })}
        />
        <Input
          allowClear
          disabled={disabled}
          placeholder="Judul artikel / buku"
          value={support.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
        <Input.TextArea
          disabled={disabled}
          placeholder="Deskripsi singkat"
          value={support.desc}
          onChange={(e) => patch({ desc: e.target.value })}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
        <Select
          allowClear
          showSearch
          disabled={disabled}
          placeholder="Atribusi ke user (opsional - default Pengimpor CSV)"
          filterOption={false}
          options={userOptions}
          value={attributedTo}
          searchValue={userSearch}
          onSearch={setUserSearch}
          onChange={(id) => onAttributedToChange(id)}
          style={{ width: '100%' }}
        />
      </Flex>
    </Card>
  );
}
