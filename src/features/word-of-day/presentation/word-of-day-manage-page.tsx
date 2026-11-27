import { useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { listWordsRequest } from '@/features/words/infrastructure/word-api';
import {
  useAdminWordOfDay,
  useClearAdminWordOfDay,
  useSetAdminWordOfDay,
  useWordOfDayHistory,
} from '../application/use-word-of-day-admin';
import { WordOfDayCard } from './word-of-day-card';

function wibTodayString(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function sourceTag(source: string) {
  if (source === 'manual') return <Tag color="blue">Manual</Tag>;
  if (source === 'algorithm') return <Tag color="default">Algoritma</Tag>;
  return <Tag>Kosong</Tag>;
}

export function WordOfDayManagePage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const [date, setDate] = useState(wibTodayString());
  const view = useAdminWordOfDay(date, canManage);
  const history = useWordOfDayHistory(canManage);
  const setMutation = useSetAdminWordOfDay(date);
  const clearMutation = useClearAdminWordOfDay(date);
  const [searchLemma, setSearchLemma] = useState('');
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const historyRows = useMemo(() => history.data ?? [], [history.data]);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola kata hari ini.
      </Typography.Text>
    );
  }

  const onDateChange = (value: Dayjs | null) => {
    if (!value) return;
    setDate(value.format('YYYY-MM-DD'));
    setPickedId(null);
    setSearchLemma('');
  };

  const searchWords = async (q: string) => {
    setSearchLemma(q);
    const term = q.trim();
    if (term.length < 2) {
      setOptions([]);
      return;
    }
    try {
      const page = await listWordsRequest({ q: term, published: true, limit: 12 });
      setOptions(
        page.data.map((w) => ({
          value: w.id,
          label: w.lemma,
        })),
      );
    } catch {
      setOptions([]);
    }
  };

  const applyWord = async () => {
    if (!pickedId) {
      message.warning('Pilih kata dari daftar dulu');
      return;
    }
    try {
      await setMutation.mutateAsync({ date, word_id: pickedId });
      message.success('Kata hari ini diperbarui');
      setPickedId(null);
      setSearchLemma('');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const onClear = async () => {
    try {
      await clearMutation.mutateAsync(date);
      message.success('Simpanan dihapus. Algoritma akan jalan lagi saat dibaca.');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Kata Hari Ini"
        subtitle="Override manual per tanggal WIB. Mobile & beranda pakai GET /words/today."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => view.refetch()}>
            Muat ulang
          </Button>
        }
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <WordOfDayCard />

        <Card title="Kelola tanggal" size="small">
          <Space wrap align="start">
            <DatePicker
              value={dayjs(date)}
              onChange={onDateChange}
              allowClear={false}
            />
            {view.data ? sourceTag(view.data.source) : null}
          </Space>

          {view.data ? (
            <Typography.Paragraph style={{ marginTop: 12 }}>
              <Typography.Text strong>
                {view.data.lemma ?? '(belum ada kata)'}
              </Typography.Text>
              {view.data.word_id ? (
                <Typography.Text type="secondary"> ({view.data.word_id})</Typography.Text>
              ) : null}
            </Typography.Paragraph>
          ) : null}

          <Space direction="vertical" style={{ width: '100%', maxWidth: 480 }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={options}
              value={searchLemma}
              onSearch={searchWords}
              onSelect={(id) => {
                setPickedId(id);
                const label = options.find((o) => o.value === id)?.label ?? id;
                setSearchLemma(label);
              }}
              placeholder="Cari kata terbit (min. 2 huruf)"
            />
            <Space>
              <Button
                type="primary"
                loading={setMutation.isPending}
                onClick={applyWord}
              >
                Terapkan ke {date}
              </Button>
              <Popconfirm
                title="Hapus simpanan untuk tanggal ini?"
                description="Pilihan algoritma akan dihitung ulang saat endpoint dibaca."
                onConfirm={onClear}
                disabled={view.data?.source === 'empty'}
              >
                <Button danger loading={clearMutation.isPending}>
                  Kembalikan ke algoritma
                </Button>
              </Popconfirm>
            </Space>
          </Space>
        </Card>

        <Table
          rowKey="date"
          size="small"
          loading={history.isLoading}
          dataSource={historyRows}
          pagination={false}
          columns={[
            { title: 'Tanggal', dataIndex: 'date', width: 120 },
            { title: 'Lemma', dataIndex: 'lemma', render: (v) => v ?? '-' },
            {
              title: 'Sumber',
              dataIndex: 'source',
              width: 110,
              render: (v: string) => sourceTag(v),
            },
            {
              title: 'Diubah',
              dataIndex: 'updated_at',
              render: (v: string | null) =>
                v ? new Date(v).toLocaleString('id-ID') : '-',
            },
          ]}
        />
      </Space>
    </>
  );
}