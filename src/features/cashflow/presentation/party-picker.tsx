import { useEffect, useState } from 'react';
import { Select } from 'antd';
import type { PartyValue } from '../domain/cashflow';
import { useCashflowLookup } from '../application/use-cashflow';

/** Prefix nilai opsi untuk nama bebas (tanpa akun). Id asli tidak pernah berawalan ini. */
const FREE_PREFIX = 'free:';

interface PartyOption {
  value: string;
  label: string;
  nama: string;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export interface PartyPickerProps {
  /** `user` mencari akun Sambasku, `usaha` mencari data usaha. */
  kind: 'user' | 'usaha';
  /** Boleh ketik nama bebas tanpa akun (untuk perorangan dan penalang). */
  allowFreeText?: boolean;
  placeholder?: string;
  /** Diisi otomatis oleh Form.Item. */
  value?: PartyValue | null;
  onChange?: (value: PartyValue | undefined) => void;
}

/**
 * Picker donatur, sponsor, dan penalang. Cari akun/usaha dari database, atau (jika diizinkan)
 * pakai nama bebas. Akun/usaha terpilih membawa `id`, nama bebas membawa `id: null`.
 */
export function PartyPicker({ kind, allowFreeText = false, placeholder, value, onChange }: PartyPickerProps) {
  const [search, setSearch] = useState('');
  const typed = search.trim();
  const debounced = useDebounced(typed, 300);
  const lookup = useCashflowLookup(kind, debounced);

  const options: PartyOption[] = (lookup.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.nama} (${item.detail})`,
    nama: item.nama,
  }));
  if (allowFreeText && typed.length >= 2) {
    options.push({ value: `${FREE_PREFIX}${typed}`, label: `Pakai "${typed}" (tanpa akun)`, nama: typed });
  }

  const selected = value
    ? {
        value: value.id ?? `${FREE_PREFIX}${value.nama}`,
        label: value.id ? value.nama : `${value.nama} (tanpa akun)`,
      }
    : undefined;

  const emptyText =
    typed.length < 2 ? 'Ketik minimal 2 huruf untuk mencari' : lookup.isFetching ? 'Mencari...' : 'Tidak ada hasil';

  return (
    <Select
      showSearch={{ filterOption: false, onSearch: setSearch }}
      labelInValue
      allowClear
      value={selected}
      options={options}
      loading={lookup.isFetching}
      placeholder={placeholder}
      notFoundContent={emptyText}
      onChange={(next, option) => {
        setSearch('');
        if (!next) {
          onChange?.(undefined);
          return;
        }
        const nama = (option as PartyOption).nama ?? String(next.label);
        const key = String(next.value);
        onChange?.({ id: key.startsWith(FREE_PREFIX) ? null : key, nama });
      }}
    />
  );
}
