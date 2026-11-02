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
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import {
  PANTUN_REPORT_REASON_LABEL,
  PANTUN_REPORT_TARGET_LABEL,
  type PantunReport,
  type PantunReportResolution,
  type PantunReportStatus,
} from '../infrastructure/pantun-report-api';
import {
  usePantunReports,
  useResolvePantunReport,
} from '../application/use-pantun-reports';

const columnHelper = createColumnHelper<typeof tableFeatureSet, PantunReport>();

const STATUS_LABEL: Record<PantunReportStatus, string> = {
  open: 'Terbuka',
  resolved: 'Selesai',
  dismissed: 'Diabaikan',
};

const STATUS_COLOR: Record<PantunReportStatus, string> = {
  open: 'gold',
  resolved: 'green',
  dismissed: 'default',
};

export function PantunReportsPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<PantunReportStatus>('open');
  const [selected, setSelected] = useState<PantunReport | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] =
    useState<PantunReportResolution>('taken_down');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const reports = usePantunReports({ status });
  const resolve = useResolvePantunReport();

  const submitResolve = async () => {
    if (!selected) return;
    const trimmed = note.trim();
    if (trimmed.length < 3) {
      message.warning('Tulis tindakan yang diambil (min 3 karakter).');
      return;
    }
    setBusy(true);
    try {
      await resolve.mutateAsync({ id: selected.id, resolution, note: trimmed });
      message.success(
        resolution === 'taken_down'
          ? 'Pantun ditarik dan laporan ditutup'
          : 'Laporan diabaikan, pantun tetap tayang',
      );
      setResolveOpen(false);
      setSelected(null);
      setNote('');
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
      header: 'Isi pantun',
      size: 420,
      cell: (info) => {
        const row = info.row.original;
        return (
          <Space direction="vertical" size={2}>
            <Tag>{PANTUN_REPORT_TARGET_LABEL[row.targetType]}</Tag>
            <Typography.Paragraph
              ellipsis={{ rows: 4, expandable: true }}
              style={{ margin: 0, whiteSpace: 'pre-line' }}
            >
              {row.targetLines?.join('\n') ?? '-'}
            </Typography.Paragraph>
          </Space>
        );
      },
    }),
    columnHelper.display({
      id: 'author',
      header: 'Penulis',
      size: 160,
      cell: (info) => {
        const row = info.row.original;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>
              {row.targetDisplayName ?? row.targetUsername ?? '-'}
            </Typography.Text>
            <Typography.Text type="secondary">
              @{row.targetUsername ?? '-'}
            </Typography.Text>
          </Space>
        );
      },
    }),
    columnHelper.accessor('reasonCode', {
      header: 'Alasan',
      size: 180,
      cell: (info) => (
        <Tag>{PANTUN_REPORT_REASON_LABEL[info.getValue()] ?? info.getValue()}</Tag>
      ),
    }),
    columnHelper.accessor('note', {
      header: 'Catatan pelapor',
      size: 240,
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
            setNote(row.resolutionNote ?? '');
            setResolution(row.resolution ?? 'taken_down');
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
        title="Laporan pantun"
        subtitle="Laporan pengguna atas pantun/balasan. Konten tetap tayang sampai kamu memutuskan."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void reports.refetch()}>
            Muat ulang
          </Button>
        }
      />
      <Space style={{ marginBottom: 16 }}>
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as PantunReportStatus)}
          options={(Object.keys(STATUS_LABEL) as PantunReportStatus[]).map((s) => ({
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
        <Typography.Text type="secondary">
          {(reports.data ?? []).length} laporan
        </Typography.Text>
      </Flex>

      <Drawer
        title="Tinjau laporan"
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
            <Space wrap>
              <Tag>{PANTUN_REPORT_TARGET_LABEL[selected.targetType]}</Tag>
              {selected.targetStatus ? <Tag>{selected.targetStatus}</Tag> : null}
              <Tag>{PANTUN_REPORT_REASON_LABEL[selected.reasonCode] ?? selected.reasonCode}</Tag>
              <Tag color={STATUS_COLOR[selected.status]}>
                {STATUS_LABEL[selected.status]}
              </Tag>
            </Space>
            <Typography.Paragraph
              style={{ whiteSpace: 'pre-line', margin: 0, fontSize: 16 }}
            >
              {selected.targetLines?.join('\n') ?? '-'}
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              Penulis: {selected.targetDisplayName ?? selected.targetUsername ?? '-'}
            </Typography.Text>
            <div>
              <Typography.Text type="secondary">Catatan pelapor</Typography.Text>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {selected.note ?? '-'}
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                Dilaporkan{' '}
                {selected.displayName ?? selected.username ?? 'pengguna'}{' '}
                pada {formatDateTime(selected.createdAt)}
              </Typography.Text>
            </div>
            {selected.resolution ? (
              <Alert
                type="success"
                showIcon
                message={
                  selected.resolution === 'taken_down'
                    ? 'Pantun ditarik'
                    : 'Laporan diabaikan'
                }
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
          <Radio.Group
            value={resolution}
            onChange={(e) => setResolution(e.target.value as PantunReportResolution)}
          >
            <Space direction="vertical">
              <Radio value="taken_down">
                Tarik pantun - laporan benar, konten melanggar
              </Radio>
              <Radio value="dismissed">Abaikan - laporan tidak berdasar</Radio>
            </Space>
          </Radio.Group>
          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tindakan yang diambil (wajib, min 3 karakter)"
            maxLength={500}
            showCount
            rows={3}
          />
        </Space>
      </Modal>
    </>
  );
}
