import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Drawer,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAdminReportsRequest,
  resolveReportRequest,
} from '../infrastructure/encyclopedia-api';
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_COLOR,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_LABEL,
  type ArticleReportListItem,
  type ReportStatus,
} from '../domain/encyclopedia';

export function EncyclopediaReportsPage() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>('open');
  const [selectedReport, setSelectedReport] = useState<ArticleReportListItem | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState<'dismissed' | 'taken_down'>('taken_down');
  const [resolutionNote, setResolutionNote] = useState('');
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ['encyclopedia', 'reports', statusFilter],
    queryFn: ({ signal }) => listAdminReportsRequest({ status: statusFilter, limit: 50 }, signal),
  });

  const resolveMutation = useMutation({
    mutationFn: (body: { id: string; resolution: 'dismissed' | 'taken_down'; note?: string | null }) =>
      resolveReportRequest(body.id, { resolution: body.resolution, note: body.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'reports'] });
    },
  });

  const items = query.data?.items ?? [];

  const handleResolve = async () => {
    if (!selectedReport) return;
    setBusy(true);
    try {
      await resolveMutation.mutateAsync({
        id: selectedReport.id,
        resolution,
        note: resolutionNote.trim() || null,
      });
      message.success(
        resolution === 'taken_down'
          ? 'Konten ditakedown dan laporan diselesaikan'
          : 'Laporan diabaikan',
      );
      setResolveOpen(false);
      setSelectedReport(null);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Laporan Konten Ensiklopedia"
        subtitle="Tangani laporan pelanggaran pada artikel dan komentar pembaca."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Muat ulang
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          value={statusFilter}
          style={{ width: 160 }}
          allowClear
          placeholder="Semua status"
          onChange={setStatusFilter}
          options={[
            { value: 'open', label: 'Terbuka' },
            { value: 'resolved', label: 'Selesai' },
            { value: 'dismissed', label: 'Diabaikan' },
          ]}
        />
      </Space>

      <Table<ArticleReportListItem>
        rowKey="id"
        loading={query.isLoading}
        dataSource={items}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          {
            title: 'Target',
            key: 'target_type',
            width: 140,
            render: (_, row) => (
              <Tag color={row.target_type === 'article' ? 'blue' : 'orange'}>
                {REPORT_TARGET_LABEL[row.target_type]}
              </Tag>
            ),
          },
          {
            title: 'Alasan',
            key: 'reason',
            width: 160,
            render: (_, row) => (
              <Tag>{REPORT_REASON_LABEL[row.reason_code] ?? row.reason_code}</Tag>
            ),
          },
          {
            title: 'Catatan Pelapor',
            key: 'note',
            render: (_, row) => (
              <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                {row.note ?? '-'}
              </Typography.Paragraph>
            ),
          },
          {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_, row) => (
              <Tag color={REPORT_STATUS_COLOR[row.status]}>{REPORT_STATUS_LABEL[row.status]}</Tag>
            ),
          },
          {
            title: 'Tanggal',
            key: 'created_at',
            width: 160,
            render: (_, row) => formatDateTime(row.created_at),
          },
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_, row) => (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setSelectedReport(row);
                  setResolution('taken_down');
                  setResolutionNote('');
                }}
              >
                Tinjau
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title="Detail Laporan"
        open={selectedReport != null && !resolveOpen}
        onClose={() => setSelectedReport(null)}
        width={500}
        destroyOnClose
        extra={
          selectedReport?.status === 'open' ? (
            <Button type="primary" onClick={() => setResolveOpen(true)}>
              Tindak Lanjut
            </Button>
          ) : null
        }
      >
        {selectedReport ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">ID Sasaran:</Typography.Text>
              <div>
                <Typography.Text code copyable>
                  {selectedReport.target_id}
                </Typography.Text>
              </div>
            </div>

            <Space wrap>
              <Tag color={selectedReport.target_type === 'article' ? 'blue' : 'orange'}>
                {REPORT_TARGET_LABEL[selectedReport.target_type]}
              </Tag>
              <Tag>{REPORT_REASON_LABEL[selectedReport.reason_code] ?? selectedReport.reason_code}</Tag>
              <Tag color={REPORT_STATUS_COLOR[selectedReport.status]}>
                {REPORT_STATUS_LABEL[selectedReport.status]}
              </Tag>
            </Space>

            <div>
              <Typography.Text strong>Catatan Pelapor:</Typography.Text>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                {selectedReport.note ?? '-'}
              </Typography.Paragraph>
            </div>

            <Typography.Text type="secondary">
              Dilaporkan pada {formatDateTime(selectedReport.created_at)}
            </Typography.Text>

            {selectedReport.resolution ? (
              <div style={{ background: '#f6ffed', padding: 12, borderRadius: 6, border: '1px solid #b7eb8f' }}>
                <Typography.Text strong style={{ color: '#389e0d' }}>
                  Keputusan: {selectedReport.resolution === 'taken_down' ? 'Ditarik / Takedown' : 'Diabaikan'}
                </Typography.Text>
                {selectedReport.resolution_note ? (
                  <div style={{ marginTop: 4 }}>{selectedReport.resolution_note}</div>
                ) : null}
              </div>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Tindak Lanjut Laporan"
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={handleResolve}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={busy}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <Space direction="vertical">
              <Radio value="taken_down">Takedown / Tarik Konten (hapus artikel/komentar)</Radio>
              <Radio value="dismissed">Abaikan Laporan (laporan tidak berdasar)</Radio>
            </Space>
          </Radio.Group>

          <Input.TextArea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Catatan resolusi atau alasan tindakan..."
            maxLength={500}
            showCount
            rows={3}
          />
        </Space>
      </Modal>
    </>
  );
}