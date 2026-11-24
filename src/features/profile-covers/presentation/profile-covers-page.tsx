import { useMemo, useState } from 'react';
import {
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import {
  App as AntdApp,
  Button,
  Card,
  Image,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  PROFILE_COVER_SPECS,
  type ProfileCover,
  type ProfileCoverVariant,
} from '../domain/profile-cover';
import {
  useActivateProfileCover,
  useCreateProfileCover,
  useDeleteProfileCover,
  useProfileCoverList,
} from '../application/use-profile-covers';
import { uploadProfileCoverWebp } from '../infrastructure/profile-cover-api';

function VariantPanel({ variant }: { variant: ProfileCoverVariant }) {
  const spec = PROFILE_COVER_SPECS[variant];
  const { message } = AntdApp.useApp();
  const list = useProfileCoverList(variant);
  const createMutation = useCreateProfileCover(variant);
  const activateMutation = useActivateProfileCover(variant);
  const deleteMutation = useDeleteProfileCover(variant);
  const [uploading, setUploading] = useState(false);

  const items = useMemo(() => list.data ?? [], [list.data]);
  const active = items.find((row) => row.is_active) ?? null;

  const handleUpload: UploadProps['beforeUpload'] = async (file) => {
    setUploading(true);
    try {
      const { url, fileId, sizeBytes } = await uploadProfileCoverWebp(
        variant,
        file as File,
      );
      await createMutation.mutateAsync({
        variant,
        url,
        file_id: fileId,
        width: spec.width,
        height: spec.height,
        size_bytes: sizeBytes,
        activate: true,
      });
      message.success('Cover baru aktif');
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  const columns = [
    {
      title: 'Pratinjau',
      width: 160,
      render: (_: unknown, row: ProfileCover) => (
        <Image
          src={row.url}
          alt=""
          width={120}
          height={Math.round(120 / spec.aspect)}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Status',
      width: 100,
      render: (_: unknown, row: ProfileCover) =>
        row.is_active ? <Tag color="green">Aktif</Tag> : <Tag>Arsip</Tag>,
    },
    {
      title: 'Ukuran',
      width: 120,
      render: (_: unknown, row: ProfileCover) =>
        row.size_bytes
          ? `${Math.round(row.size_bytes / 1024)} KB`
          : '-',
    },
    {
      title: 'Diunggah',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleString('id-ID'),
    },
    {
      title: 'Aksi',
      width: 200,
      render: (_: unknown, row: ProfileCover) => (
        <Space>
          <Button
            size="small"
            disabled={row.is_active || activateMutation.isPending}
            onClick={() =>
              activateMutation.mutate(row.id, {
                onSuccess: () => message.success('Cover diaktifkan lagi'),
                onError: (err) => message.error(normalizeError(err).message),
              })
            }
          >
            Pakai lagi
          </Button>
          <Popconfirm
            title="Hapus cover dari riwayat?"
            disabled={row.is_active}
            onConfirm={() =>
              deleteMutation.mutate(row.id, {
                onSuccess: () => message.success('Cover dihapus'),
                onError: (err) => message.error(normalizeError(err).message),
              })
            }
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={row.is_active}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Cover aktif" size="small">
        {active ? (
          <Image
            src={active.url}
            alt=""
            width="100%"
            style={{ maxWidth: 520, objectFit: 'cover' }}
          />
        ) : (
          <Typography.Text type="secondary">
            Belum ada cover aktif. Mobile memakai asset fallback sampai ada yang
            aktif.
          </Typography.Text>
        )}
      </Card>

      <Card
        title="Unggah baru"
        size="small"
        extra={
          <Typography.Text type="secondary">
            {spec.width}x{spec.height} WebP
          </Typography.Text>
        }
      >
        <ImgCrop aspect={spec.aspect} rotationSlider quality={1}>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={uploading || createMutation.isPending}
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading || createMutation.isPending}
            >
              Pilih, crop, unggah
            </Button>
          </Upload>
        </ImgCrop>
      </Card>

      <Table
        rowKey="id"
        size="small"
        loading={list.isLoading}
        dataSource={items}
        columns={columns}
        pagination={false}
      />
    </Space>
  );
}

export function ProfileCoversPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const [tab, setTab] = useState<ProfileCoverVariant>('tab');

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola cover profil.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Cover Profil"
        subtitle="Tab Profil, profil publik, dan kartu Kata Hari Ini. Riwayat bisa dipakai lagi."
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            Muat ulang
          </Button>
        }
      />
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as ProfileCoverVariant)}
        items={[
          {
            key: 'tab',
            label: PROFILE_COVER_SPECS.tab.label,
            children: <VariantPanel variant="tab" />,
          },
          {
            key: 'public',
            label: PROFILE_COVER_SPECS.public.label,
            children: <VariantPanel variant="public" />,
          },
          {
            key: 'wotd',
            label: PROFILE_COVER_SPECS.wotd.label,
            children: <VariantPanel variant="wotd" />,
          },
        ]}
      />
    </>
  );
}