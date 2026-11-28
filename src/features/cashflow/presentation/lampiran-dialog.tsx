import dayjs from 'dayjs';
import { App as AntdApp, Button, Modal, Popconfirm, Space, Table, Tag, Typography, Upload } from 'antd';
import { DeleteOutlined, FileOutlined, InboxOutlined, LinkOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { lampiranUrlRequest } from '../infrastructure/cashflow-api';
import { formatRupiah, type CashLampiran, type CashTransaksi } from '../domain/cashflow';
import { useCashflowLampiran, useHapusLampiran, useUploadLampiran } from '../application/use-cashflow';

/** Sama dengan MAX_LAMPIRAN_PER_TRANSAKSI di API. Server tetap jadi penentu. */
const MAX_LAMPIRAN_PER_TRANSAKSI = 10;

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

const JENIS_LABEL: Record<CashLampiran['mime'], string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Gambar',
  'image/png': 'Gambar',
  'image/webp': 'Gambar',
};

function formatUkuran(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface LampiranDialogProps {
  tx: CashTransaksi;
  onClose: () => void;
}

/**
 * Lampiran bukti satu transaksi: unggah (PDF atau gambar), daftar, buka, dan hapus.
 * Dialog dimount saat dibuka. Unggah ulang file yang sama aman karena server mendedupe.
 */
export function LampiranDialog({ tx, onClose }: LampiranDialogProps) {
  const { message } = AntdApp.useApp();
  const lampiranQ = useCashflowLampiran(tx.id);
  const upload = useUploadLampiran();
  const hapus = useHapusLampiran();

  const daftar = lampiranQ.data ?? [];
  const penuh = daftar.length >= MAX_LAMPIRAN_PER_TRANSAKSI;

  const handleFile = async (file: File) => {
    try {
      await upload.mutateAsync({ txId: tx.id, file });
      message.success('Lampiran ditambahkan');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const bukaFile = async (row: CashLampiran) => {
    // Tab dibuka dulu di klik pertama, supaya tidak diblokir pop-up. URL diisi setelah diambil.
    const tab = window.open('', '_blank');
    if (!tab) {
      message.error('Pop-up diblokir browser. Izinkan pop-up untuk situs ini, lalu coba lagi.');
      return;
    }
    tab.opener = null;
    try {
      const { url } = await lampiranUrlRequest(row.id);
      tab.location.href = url;
    } catch (err) {
      tab.close();
      message.error(normalizeError(err).message);
    }
  };

  const handleHapus = async (row: CashLampiran) => {
    try {
      await hapus.mutateAsync(row.id);
      message.success('Lampiran dihapus dari daftar');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal title="Lampiran bukti" open onCancel={onClose} footer={null} destroyOnHidden width={720}>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        {formatRupiah(tx.nominal)} pada {dayjs(tx.tanggal).format('D MMM YYYY')}. Maksimal {MAX_LAMPIRAN_PER_TRANSAKSI} file
        per transaksi. Bisa PDF atau gambar (JPG, PNG, WebP).
      </Typography.Paragraph>

      <Upload.Dragger
        accept={ACCEPT}
        multiple={false}
        showUploadList={false}
        disabled={upload.isPending || penuh}
        beforeUpload={(file) => {
          void handleFile(file);
          return false;
        }}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {penuh ? 'Sudah mencapai batas. Hapus lampiran dulu untuk menambah.' : 'Klik atau seret file ke sini'}
        </p>
        <p className="ant-upload-hint">Satu file per unggah. Gambar dan PDF diperiksa dari isi file-nya.</p>
      </Upload.Dragger>

      <Table<CashLampiran>
        rowKey="id"
        size="small"
        loading={lampiranQ.isLoading}
        dataSource={daftar}
        pagination={false}
        locale={{ emptyText: 'Belum ada lampiran. Unggah nota, struk, atau bukti transfer di atas.' }}
        columns={[
          {
            title: 'Nama file',
            dataIndex: 'original_name',
            key: 'name',
            render: (v: string) => (
              <Space size={6}>
                <FileOutlined />
                <span style={{ wordBreak: 'break-all' }}>{v}</span>
              </Space>
            ),
          },
          {
            title: 'Jenis',
            dataIndex: 'mime',
            key: 'mime',
            width: 90,
            render: (v: CashLampiran['mime']) => <Tag>{JENIS_LABEL[v]}</Tag>,
          },
          { title: 'Ukuran', dataIndex: 'size_bytes', key: 'size', width: 90, render: (v: number) => formatUkuran(v) },
          {
            title: 'Diunggah',
            dataIndex: 'created_at',
            key: 'created',
            width: 130,
            render: (v: string) => dayjs(v).format('D MMM YYYY HH:mm'),
          },
          {
            title: '',
            key: 'ops',
            width: 150,
            render: (_: unknown, row: CashLampiran) => (
              <Space size={4}>
                <Button size="small" icon={<LinkOutlined />} onClick={() => bukaFile(row)}>
                  Buka
                </Button>
                <Popconfirm
                  title="Hapus lampiran ini?"
                  description="File tetap tersimpan di arsip. Hanya tidak tampil lagi di sini."
                  okText="Hapus"
                  okButtonProps={{ danger: true }}
                  cancelText="Batal"
                  onConfirm={() => handleHapus(row)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label="Hapus lampiran" />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
}
