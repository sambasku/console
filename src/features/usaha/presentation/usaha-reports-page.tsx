import { useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Drawer,
  Flex,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import type { UsahaReport, UsahaReportStatus } from '../domain/usaha';
import { useResolveUsahaReport, useUsahaReports } from '../application/use-usaha';
import { USAHA_REPORT_REASON_LABEL } from '../infrastructure/usaha-moderation-api';

const columnHelper = createColumnHelper<typeof tableFeatureSet, UsahaReport>();

const STATUS_LABEL: Record<UsahaReportStatus, string> = {
  open: 'Terbuka',
  resolved: 'Selesai',
  dismissed: 'Diabaikan',
};

const STATUS_COLOR: Record<UsahaReportStatus, string> = {
  open: 'gold',
  resolved: 'green',
  dismissed: 'default',
};

export function UsahaReportsPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<UsahaReportStatus>('open');
  const [selected, setSelected] = useState<UsahaReport | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [outcome, setOutcome] = useState<'resolved' | 'dismissed'>('resolved');
  const [busy, setBusy] = useState(false);

  const reports = useUsahaReports({ status });
  const resolve = useResolveUsahaReport();

  const submitResolve = async () => {
    if (!selected) return;
    const trimmed = resolution.trim();
    if (trimmed.length < 3) {
      message.warning('Tulis tindakan yang diambil (min 3 karakter).');
      return;
    }
    setBusy(true);
    try {
      await resolve.mutateAsync({
        id: selected.id,
        status: outcome,
        resolution: trimmed,
        resolution_note: resolutionNote.trim() || null,
      });
      message.success('Laporan ditindaklanjuti');
      setSelected(null);
      setResolveOpen(false);
      void reports.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const columns = columnHelper.columns([
    columnHelper.accessor('usahaName', {
      header: 'Usaha',
      size: 220,
      cell: (info) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{info.getValue() ?? info.row.original.usahaId}</Typography.Text>
          <Typography.Text type="secondary">{info.row.original.usahaSlug ?? '-'}</Typography.Text>
        </Space>
      ),
    }),
    columnHelper.accessor('reasonCode', {
      header: 'Alasan',
      size: 150,
      cell: (info) => <Tag>{USAHA_REPORT_REASON_LABEL[info.getValue()] ?? info.getValue()}</Tag>,
    }),
    columnHelper.accessor('note', {
      header: 'Catatan',
      size: 280,
      cell: (info) => (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
          {info.getValue() ?? '-'}
        </Typography.Paragraph>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 110,
      cell: (info) => <Tag color={STATUS_COLOR[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Tag>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Dilaporkan',
      size: 160,
      cell: (info) => formatDateTime(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      size: 130,
      meta: { fixed: 'right' },
      cell: (info) => (
        <Button
          type="link"
          onClick={() => {
            setSelected(info.row.original);
            setResolution(info.row.original.resolution ?? '');
            setResolutionNote(info.row.original.resolutionNote ?? '');
            setOutcome('resolved');
            setResolveOpen(true);
          }}
        >
          Tindak lanjut
        </Button>
      ),
    }),
  ]);

  const table = useTable({
    features: tableFeatureSet,
    data: reports.data ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <PageHeader
        title="Laporan usaha"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void reports.refetch()}>
            Muat ulang
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          value={status}
          style={{ width: 160 }}
          onChange={(v) => setStatus(v)}
          options={(Object.keys(STATUS_LABEL) as UsahaReportStatus[]).map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
        />
      </Space>

      {reports.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat laporan"
          description={normalizeError(reports.error).message}
        />
      ) : null}

      <DataTable table={table} rowKey={(record) => record.id} loading={reports.isLoading} />
      <Flex justify="center" style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{(reports.data ?? []).length} laporan</Typography.Text>
      </Flex>

      <Drawer
        title="Tindak lanjut laporan"
        open={selected != null && !resolveOpen}
        onClose={() => setSelected(null)}
        width={520}
        destroyOnHidden
        extra={
          <Button type="primary" onClick={() => setResolveOpen(true)}>
            Tulis tindakan
          </Button>
        }
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {selected.usahaName ?? selected.usahaId}
            </Typography.Title>
            <Tag>{USAHA_REPORT_REASON_LABEL[selected.reasonCode] ?? selected.reasonCode}</Tag>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {selected.note ?? '-'}
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              Dilaporkan {formatDateTime(selected.createdAt)}
            </Typography.Text>
            {selected.resolution ? (
              <Alert
                type="success"
                showIcon
                message={selected.resolution}
                description={selected.resolutionNote ?? undefined}
              />
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Tindak lanjut laporan"
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={submitResolve}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={busy}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <Space direction="vertical">
              <Radio value="resolved">Selesai - laporan benar, sudah ditindak</Radio>
              <Radio value="dismissed">Abaikan - laporan tidak berdasar</Radio>
            </Space>
          </Radio.Group>
          <Input
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Tindakan yang diambil, mis. data sudah diperbaiki"
            maxLength={500}
            showCount
          />
          <Input.TextArea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Catatan internal (opsional)"
            maxLength={1000}
            showCount
            rows={3}
          />
        </Space>
      </Modal>
    </>
  );
}
