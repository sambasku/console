import { App as AntdApp, Button, Input, Space, Table, Tag, Typography } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAdminBaleho, useBalehoMutations } from '../application/use-baleho';
import type { BalehoPlacementStatus, BalehoPlacementWire } from '../infrastructure/baleho-api';

const STATUS_COLOR: Record<BalehoPlacementStatus, string> = {
  pending_review: 'gold',
  awaiting_payment: 'blue',
  live: 'green',
  rejected: 'red',
  cancelled: 'default',
  expired: 'default',
};

export function BalehoPage() {
  const { message, modal } = AntdApp.useApp();
  const list = useAdminBaleho();
  const actions = useBalehoMutations();

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      message.success(label);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (s: BalehoPlacementStatus) => (
        <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Pengiklan',
      dataIndex: 'advertiser_username',
      render: (v: string | null, row: BalehoPlacementWire) =>
        v ?? row.advertiser_user_id.slice(0, 8),
    },
    {
      title: 'Area',
      render: (_: unknown, row: BalehoPlacementWire) =>
        `${row.w}x${row.h} @ ${row.col + 1},${row.row + 1}`,
    },
    {
      title: 'Referral',
      dataIndex: 'referral_username',
      render: (v: string | null) => v ?? '-',
    },
    {
      title: 'Impresi',
      dataIndex: 'impressions',
      width: 90,
      render: (v: number | undefined) => v ?? 0,
    },
    {
      title: 'Tap',
      dataIndex: 'taps',
      width: 70,
      render: (v: number | undefined) => v ?? 0,
    },
    {
      title: 'CTR',
      dataIndex: 'ctr_percent',
      width: 80,
      render: (v: number | undefined) => `${v ?? 0}%`,
    },
    {
      title: 'Dibuat',
      dataIndex: 'created_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('id-ID'),
    },
    {
      title: 'Aksi',
      width: 320,
      render: (_: unknown, row: BalehoPlacementWire) => (
        <Space wrap size="small">
          {row.status === 'pending_review' && (
            <>
              <Button
                size="small"
                type="primary"
                loading={actions.approve.isPending}
                onClick={() =>
                  run('Disetujui - notifikasi bayar dikirim', () =>
                    actions.approve.mutateAsync(row.id),
                  )
                }
              >
                Setujui
              </Button>
              <Button
                size="small"
                danger
                loading={actions.reject.isPending}
                onClick={() => {
                  let reason = '';
                  modal.confirm({
                    title: 'Tolak pesanan ini?',
                    content: (
                      <Input.TextArea
                        rows={3}
                        placeholder="Alasan untuk pengiklan (opsional)"
                        onChange={(e) => {
                          reason = e.target.value;
                        }}
                      />
                    ),
                    okText: 'Tolak',
                    okButtonProps: { danger: true },
                    onOk: () =>
                      run('Ditolak', () =>
                        actions.reject.mutateAsync({
                          id: row.id,
                          reason: reason.trim() || undefined,
                        }),
                      ),
                  });
                }}
              >
                Tolak
              </Button>
            </>
          )}
          {row.status === 'awaiting_payment' && (
            <>
              <Button
                size="small"
                type="primary"
                loading={actions.markPaid.isPending}
                onClick={() =>
                  run('Ditandai lunas - live', () =>
                    actions.markPaid.mutateAsync(row.id),
                  )
                }
              >
                Tandai lunas
              </Button>
              <Button
                size="small"
                loading={actions.pause.isPending}
                onClick={() =>
                  run('Dibatalkan', () =>
                    actions.pause.mutateAsync({ id: row.id, reason: 'admin' }),
                  )
                }
              >
                Batalkan
              </Button>
            </>
          )}
          {row.status === 'live' && (
            <Button
              size="small"
              danger
              loading={actions.pause.isPending}
              onClick={() => {
                modal.confirm({
                  title: 'Pause / turunkan iklan?',
                  content: 'Area akan dilepas dari papan.',
                  okText: 'Pause',
                  okButtonProps: { danger: true },
                  onOk: () =>
                    run('Di-pause', () =>
                      actions.pause.mutateAsync({
                        id: row.id,
                        reason: 'takedown',
                      }),
                    ),
                });
              }}
            >
              Pause
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Baleho" />
      <Typography.Paragraph type="secondary">
        Moderasi pesanan slide 1. Setujui → email + WA instruksi bayar. Tandai
        lunas → live. Pause melepas area.
      </Typography.Paragraph>
      <Table
        rowKey="id"
        size="small"
        loading={list.isLoading}
        dataSource={list.data ?? []}
        columns={columns}
        pagination={{ pageSize: 50 }}
      />
    </>
  );
}
