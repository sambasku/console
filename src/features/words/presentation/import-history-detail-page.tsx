import { useEffect, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Button,
  Descriptions,
  Flex,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DownloadOutlined, RollbackOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { normalizeError } from '@/shared/api/error';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { PageHeader } from '@/shared/components/page-header';
import { PageLoading } from '@/shared/components/page-loading';
import { listAdminUsersRequest } from '@/features/users/infrastructure/user-admin-api';
import { useImportSession } from '../application/use-import-sessions';
import { claimWordImportSessionRequest, rollbackWordImportSessionRequest, type WordImportSessionStatus } from '../infrastructure/word-api';
import { SUPPORT_TYPE_LABEL } from './import-attribution-fields';

const STATUS_LABEL: Record<WordImportSessionStatus, string> = {
  running: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
};

const STATUS_COLOR: Record<WordImportSessionStatus, string> = {
  running: 'processing',
  completed: 'success',
  cancelled: 'warning',
  failed: 'error',
};

const OUTCOME_LABEL: Record<string, string> = {
  created: 'Kata baru',
  meanings_added: 'Makna ditambah',
  skipped: 'Duplikat dilewati',
  invalid: 'Tidak valid',
};

export function ImportHistoryDetailPage() {
  const { message, modal } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams({ from: '/console-layout/words/import-history/$id' });
  const query = useImportSession(id);
  const session = query.data;

  const [claimOpen, setClaimOpen] = useState(false);
  const [claimUserId, setClaimUserId] = useState<string | undefined>();
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const debouncedUserSearch = useDebouncedValue(userSearch, 300);

  useEffect(() => {
    if (!claimOpen) return;
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
  }, [claimOpen, debouncedUserSearch]);

  const downloadReport = () => {
    if (!session) return;
    const lines = [
      'lemma,hasil,pesan',
      ...session.items.map((item) =>
        [item.lemma, item.outcome, item.message ?? '']
          .map((cell) => `"${cell.replaceAll('"', '""')}"`)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-import-${session.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openClaim = () => {
    setClaimUserId(undefined);
    setUserSearch('');
    setClaimOpen(true);
  };

  const confirmClaim = async () => {
    if (!session || !claimUserId) {
      message.warning('Pilih user untuk klaim');
      throw new Error('CLAIM_USER_REQUIRED');
    }
    setClaiming(true);
    try {
      await claimWordImportSessionRequest(session.id, { attributed_to: claimUserId });
      message.success('Batch berhasil diklaim ke user');
      setClaimOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['word-import-sessions'] });
      void query.refetch();
    } catch (err) {
      if (err instanceof Error && err.message === 'CLAIM_USER_REQUIRED') throw err;
      message.error(normalizeError(err).message);
      throw err;
    } finally {
      setClaiming(false);
    }
  };

  const confirmRollback = () => {
    if (!session) return;
    modal.confirm({
      title: 'Tarik semua kata impor ini?',
      content: (
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          Soft-delete semua kata yang dibuat oleh sesi ini ({session.created_count} kata baru).
          Makna yang hanya ditambah ke lemma yang sudah ada sebelumnya tidak ikut ditarik.
          Tidak bisa dibatalkan kecuali restore manual per kata.
        </Typography.Paragraph>
      ),
      okText: 'Tarik semua',
      okButtonProps: { danger: true },
      cancelText: 'Batal',
      onOk: async () => {
        setRollingBack(true);
        try {
          const result = await rollbackWordImportSessionRequest(session.id);
          message.success(
            result.deleted_count > 0
              ? `${result.deleted_count} kata berhasil ditarik`
              : 'Tidak ada kata aktif yang perlu ditarik',
          );
          void queryClient.invalidateQueries({ queryKey: ['word-import-sessions'] });
          void query.refetch();
        } catch (err) {
          message.error(normalizeError(err).message);
          throw err;
        } finally {
          setRollingBack(false);
        }
      },
    });
  };

  if (query.isPending) return <PageLoading tip="Memuat sesi impor…" />;

  if (query.isError || !session) {
    return (
      <>
        <PageHeader title="Detail impor" />
        <Alert
          type="error"
          showIcon
          message="Sesi impor tidak ditemukan"
          description={query.error?.message}
          action={
            <Button onClick={() => navigate({ to: '/words/import-history' })}>Kembali</Button>
          }
        />
      </>
    );
  }

  const supportTypeLabel = session.support_type
    ? SUPPORT_TYPE_LABEL[session.support_type]
    : null;

  return (
    <>
      <PageHeader
        title={session.source_label || session.support_name || 'Sesi impor'}
        subtitle={`Atribusi: ${personLabel(session.attributed_to_display_name, session.attributed_to_username, 'Pengimpor Data CSV')}`}
        extra={
          <Flex gap={8}>
            <Button icon={<RollbackOutlined />} onClick={() => navigate({ to: '/words/import-history' })}>
              Riwayat
            </Button>
            {session.can_claim ? (
              <Button icon={<UserSwitchOutlined />} onClick={openClaim}>
                Klaim ke user
              </Button>
            ) : null}
            <Button
              danger
              loading={rollingBack}
              disabled={!!session.rolled_back_at || session.created_count === 0}
              onClick={confirmRollback}
            >
              {session.rolled_back_at ? 'Sudah ditarik' : 'Tarik semua kata impor'}
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={downloadReport}>
              Unduh CSV
            </Button>
          </Flex>
        }
      />

      {session.rolled_back_at ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Sesi ini sudah di-rollback"
          description={`Kata baru dari batch ini sudah di-soft-delete pada ${formatDateTime(session.rolled_back_at)}.`}
        />
      ) : null}

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        style={{ marginBottom: 16 }}
        title="Ringkasan"
      >
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLOR[session.status]}>{STATUS_LABEL[session.status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Waktu">
          {formatDateTime(session.finished_at ?? session.created_at)}
        </Descriptions.Item>
        <Descriptions.Item label="Atribusi">
          {personLabel(
            session.attributed_to_display_name,
            session.attributed_to_username,
            'Pengimpor Data CSV',
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Nama penunjang">{session.support_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="Diklaim oleh">
          {session.claimed_by
            ? personLabel(
                session.claimed_by_display_name,
                session.claimed_by_username,
                '-',
              )
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Waktu klaim">
          {session.claimed_at ? formatDateTime(session.claimed_at) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Rollback">
          {session.rolled_back_at ? formatDateTime(session.rolled_back_at) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Total">{session.total}</Descriptions.Item>
        <Descriptions.Item label="Kata baru">{session.created_count}</Descriptions.Item>
        <Descriptions.Item label="Duplikat">{session.duplicates_count}</Descriptions.Item>
        <Descriptions.Item label="Makna ditambah">{session.meanings_added_count}</Descriptions.Item>
        <Descriptions.Item label="Tidak valid">{session.invalid_count}</Descriptions.Item>
      </Descriptions>

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2 }}
        style={{ marginBottom: 16 }}
        title="Data Pendukung"
      >
        <Descriptions.Item label="Nama">{session.support_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="Tipe">{supportTypeLabel || '-'}</Descriptions.Item>
        <Descriptions.Item label="Alamat">
          {session.support_address ? (
            session.support_address.startsWith('http') ? (
              <Typography.Link href={session.support_address} target="_blank" rel="noreferrer">
                {session.support_address}
              </Typography.Link>
            ) : (
              session.support_address
            )
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Judul">{session.support_title || '-'}</Descriptions.Item>
        <Descriptions.Item label="Deskripsi" span={2}>
          {session.support_desc || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Item
      </Typography.Title>
      <Table
        size="small"
        rowKey={(row) => `${row.lemma}-${row.outcome}`}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        dataSource={session.items}
        columns={[
          { title: 'Lemma', dataIndex: 'lemma', width: 200 },
          {
            title: 'Hasil',
            dataIndex: 'outcome',
            width: 160,
            render: (value: string) => OUTCOME_LABEL[value] ?? value,
          },
          {
            title: 'Makna+',
            dataIndex: 'meanings_added',
            width: 90,
          },
          {
            title: 'Pesan',
            dataIndex: 'message',
            render: (value?: string) => value || '-',
          },
        ]}
      />

      <Modal
        title="Klaim batch ke user"
        open={claimOpen}
        okText="Klaim"
        cancelText="Batal"
        confirmLoading={claiming}
        onCancel={() => {
          if (!claiming) setClaimOpen(false);
        }}
        onOk={() => confirmClaim()}
        okButtonProps={{ disabled: !claimUserId }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Atribusi creator pada kata/makna batch ini akan digeser dari Pengimpor Data CSV ke
          user yang dipilih. Status tayang tidak berubah.
        </Typography.Paragraph>
        <Select
          showSearch
          allowClear
          placeholder="Pilih user…"
          filterOption={false}
          options={userOptions}
          value={claimUserId}
          searchValue={userSearch}
          onSearch={setUserSearch}
          onChange={(value) => setClaimUserId(value)}
          style={{ width: '100%' }}
        />
      </Modal>
    </>
  );
}
