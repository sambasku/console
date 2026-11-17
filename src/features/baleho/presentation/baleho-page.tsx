import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Image,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { uploadImageToCdn } from '@/shared/api/image-upload';
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

type PaymentProof = { url: string; fileId: string };

export function BalehoPage() {
  const { message, modal } = AntdApp.useApp();
  const list = useAdminBaleho();
  const actions = useBalehoMutations();
  const [markPaidRow, setMarkPaidRow] = useState<BalehoPlacementWire | null>(
    null,
  );
  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [uploading, setUploading] = useState(false);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      message.success(label);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const closeMarkPaid = () => {
    setMarkPaidRow(null);
    setProof(null);
    setUploading(false);
  };

  const onPickProof = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await uploadImageToCdn(file, '/baleho/payment-proofs');
      setProof({ url: uploaded.url, fileId: uploaded.fileId });
      message.success('Bukti pembayaran terunggah');
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setUploading(false);
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
      title: 'Bukti bayar',
      dataIndex: 'payment_proof_url',
      width: 110,
      render: (v: string | null) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            Lihat
          </a>
        ) : (
          '-'
        ),
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
                onClick={() => {
                  setProof(null);
                  setMarkPaidRow(row);
                }}
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
        lunas wajib unggah bukti transfer ke ImageKit, lalu → live. Pause
        melepas area.
      </Typography.Paragraph>
      <Table
        rowKey="id"
        size="small"
        loading={list.isLoading}
        dataSource={list.data ?? []}
        columns={columns}
        pagination={{ pageSize: 50 }}
      />
      <Modal
        title="Tandai lunas"
        open={markPaidRow != null}
        onCancel={closeMarkPaid}
        okText="Tandai lunas"
        confirmLoading={actions.markPaid.isPending || uploading}
        okButtonProps={{ disabled: !proof }}
        onOk={async () => {
          if (!markPaidRow || !proof) {
            message.warning('Unggah bukti pembayaran dulu');
            return Promise.reject();
          }
          try {
            await actions.markPaid.mutateAsync({
              id: markPaidRow.id,
              paymentProofUrl: proof.url,
              paymentProofFileId: proof.fileId,
            });
            message.success('Ditandai lunas - live');
            closeMarkPaid();
          } catch (err) {
            message.error(normalizeError(err).message);
            return Promise.reject(err);
          }
        }}
      >
        <Typography.Paragraph type="secondary">
          Unggah foto/screenshot bukti transfer. File disimpan di ImageKit
          folder <code>/baleho/payment-proofs</code> (maks 2 MB).
        </Typography.Paragraph>
        <Upload
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          showUploadList={false}
          beforeUpload={(file) => {
            void onPickProof(file);
            return false;
          }}
          disabled={uploading}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {proof ? 'Ganti bukti' : 'Unggah bukti pembayaran'}
          </Button>
        </Upload>
        {proof ? (
          <div style={{ marginTop: 12 }}>
            <Image
              src={proof.url}
              alt="Bukti pembayaran"
              width={240}
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
