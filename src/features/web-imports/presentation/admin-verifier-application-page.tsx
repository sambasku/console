import { useMemo, useState } from 'react';
import { useAuth } from '@/shared/auth/use-auth';
import { useNavigate } from '@tanstack/react-router';
import { Button, Flex, Tag, Typography } from 'antd';
import { ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useVerifierApplicationList } from '@/features/web-imports/application/use-verifier-application-list';
import {
  VerifierApplicationStatus,
  VerifierApplicationStatusLabels,
  VerifierApplicationStatusLabels as StatusLabels,
} from '@/features/web-imports/domain/verifier-application';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { UserInfoLink } from '@/shared/components/user-info-modal';
import { ColumnHelper } from '@/features/web-imports/presentation/verifier-application-column-helper';

export function AdminWebImportVerifierPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === 'admin' || user?.role === 'reviewer';
  const [statusTab, setStatusTab] = useState<VerifierApplicationStatus>('pending');
  const { data: items, isFetching, error } = useVerifierApplicationList();

  const statusLabels = StatusLabels;
  const statusTags = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
  };

  const columns = useMemo(() => {
    const colHelper = new ColumnHelper<VerifierApplicationListItem>();
    return [
      colHelper.id('id', 'ID'),
      colHelper.username('username', 'Pengaju'),
      colHelper.phone('phone', 'No HP'),
      colHelper.status('status', 'Status'),
      colHelper.createdAt('created_at', 'Waktu'),
      colHelper.action('aksi', 'Aksi'),
    ];
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Verifikasi Pengajuan Web Import"
        subtitle="Lihat daftar pengajuan, preview baris pertama, lalu setujui atau tolak"
      />

      <Flex justify="center" align="center" style={{ margin: 16, gap: 16 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => navigate('/verifier-applications')}
          disabled={isFetching}
        >
          Kembali ke Verifikasi Umum
        </Button>
      </Flex>

      <Flex justify="center" align="center" style={{ margin: 8, gap: 8 }}>
        <Tag
          color={statusTags[statusTab]}
          onClick={() => setStatusTab('all')}
          style={{ cursor: 'pointer' }}
        >
          Semua
        </Tag>
        <Tag
          color={statusTags[statusTab]}
          onClick={() => setStatusTab('pending')}
          style={{ cursor: 'pointer' }}
        >
          Menunggu
        </Tag>
        <Tag
          color={statusTags[statusTab]}
          onClick={() => setStatusTab('approved')}
          style={{ cursor: 'pointer' }}
        >
          Disetujui
        </Tag>
        <Tag
          color={statusTags[statusTab]}
          onClick={() => setStatusTab('rejected')}
          style={{ cursor: 'pointer' }}
        >
          Tolak
        </Tag>
      </Flex>

      {isFetching && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <span>Memuat data...</span>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', padding: 16, textAlign: 'center' }}>
          Error: {error}
        </div>
      )}

      <DataTable
        rowKey="id"
        columns={columns}
        data={items}
        loading={isFetching}
        error={error}
        onRowClick={(record) => {
          navigate({ to: '/verifier-applications/:id', params: { id: record.id } });
        }}
        rowClassName={(row) => `status-${row.status}`}
      />
    </div>
  );
}