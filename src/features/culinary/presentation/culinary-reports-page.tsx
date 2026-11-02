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
import type { CulinaryReport, CulinaryReportStatus } from '../domain/culinary';
import { useCulinaryReports, useResolveCulinaryReport } from '../application/use-culinary';
import {
  CULINARY_REPORT_REASON_LABEL,
  CULINARY_REPORT_TARGET_LABEL,
} from '../infrastructure/culinary-moderation-api';

const columnHelper = createColumnHelper<typeof tableFeatureSet, CulinaryReport>();

const STATUS_LABEL: Record<CulinaryReportStatus, string> = {
  open: 'Terbuka',
  resolved: 'Selesai',
  dismissed: 'Diabaikan',
};

const STATUS_COLOR: Record<CulinaryReportStatus, string> = {
  open: 'gold',
  resolved: 'green',
  dismissed: 'default',
};

export function CulinaryReportsPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<CulinaryReportStatus>('open');
  const [selected, setSelected] = useState<CulinaryReport | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [outcome, setOutcome] = useState<'resolved' | 'dismissed'>('resolved');
  const [busy, setBusy] = useState(false);

  const reports = useCulinaryReports({ status });
  const resolve = useResolveCulinaryReport();

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
      setResolveOpen(false);
      setSelected(null);
      setResolution('');
      setResolutionNote('');
      void reports.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const columns = columnHelper.columns([
    columnHelper.display({
      id: 'target',
      header: 'Sasaran',
      size: 240,
      cell: (info) => {
        const row = info.row.original;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>
              {row.targetName ?? row.targetId}
            </Typography.Text>
            <Typography.Text type="secondary">
              {CULINARY_REPORT_TARGET_LABEL[row.targetType]} - {row.targetSlug ?? '-'}
            </Typography.Text>
          </Space>
        );
      },
    }),
    columnHelper.accessor('reasonCode', {
      header: 'Alasan',
      size: 160,
      cell: (info) => (
        <Tag>{CULINARY_REPORT_REASON_LABEL[info.getValue()] ?? info.getValue()}</Tag>
      ),
    }),
    columnHelper.accessor('note', {
      header: 'Catatan pelapor',
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
      cell: (info) => (
        <Tag color={STATUS_COLOR[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Tag>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Dilaporkan',
      size: 160,
      cell: (info) => formatDateTime(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      size: 110,
      meta: { fixed: 'right' },
      cell: (info) => (
        <Button
          type="link"
          onClick={() => {
            const row = info.row.original;
            setSelected(row);
            setResolution(row.resolution ?? '');
            setResolutionNote(row.resolutionNote ?? '');
            setOutcome('resolved');
          }}
        >
          Tinjau
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
        title="Laporan kuliner"
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
          options={(Object.keys(STATUS_LABEL) as CulinaryReportStatus[]).map((s) => ({
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
          selected?.status === 'open' ? (
            <Button type="primary" onClick={() => setResolveOpen(true)}>
              Tulis tindakan
            </Button>
          ) : null
        }
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {selected.targetName ?? selected.targetId}
            </Typography.Title>
            <Space wrap>
              <Tag>{CULINARY_REPORT_TARGET_LABEL[selected.targetType]}</Tag>
              <Tag>{CULINARY_REPORT_REASON_LABEL[selected.reasonCode] ?? selected.reasonCode}</Tag>
              <Tag color={STATUS_COLOR[selected.status]}>{STATUS_LABEL[selected.status]}</Tag>
            </Space>
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
