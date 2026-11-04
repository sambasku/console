import { useEffect, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Col,
  Drawer,
  Form,
  Image,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  Upload,
} from 'antd';
import type { FormProps, UploadProps } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useAllRegions } from '@/features/regions/application/use-regions';
import {
  useUsahaCategories,
  useUsahaContributionHistory,
} from '../application/use-usaha';
import type {
  Usaha,
  UsahaContribution,
  UsahaContributionStatus,
  UsahaKind,
  UsahaOperationalStatus,
  UsahaPublishStatus,
} from '../domain/usaha';
import { uploadUsahaImage, type UsahaInput } from '../infrastructure/usaha-api';
import {
  USAHA_CONTRIBUTION_KIND_LABEL,
  USAHA_CONTRIBUTION_STATUS_LABEL,
  USAHA_FIELD_LABEL,
} from '../infrastructure/usaha-contribution-api';

const HISTORY_STATUS_COLOR: Record<UsahaContributionStatus, string> = {
  pending: 'gold',
  needs_revision: 'orange',
  approved: 'green',
  rejected: 'red',
};

function historySummary(row: UsahaContribution): string {
  const kindLabel = USAHA_CONTRIBUTION_KIND_LABEL[row.kind] ?? row.kind;
  if (row.kind === 'profile' && row.fields.length > 0) {
    const fields = row.fields
      .map((f) => USAHA_FIELD_LABEL[f] ?? f)
      .join(', ');
    return `${kindLabel}: ${fields}`;
  }
  const name = row.payload.name;
  if (typeof name === 'string' && name.trim()) {
    return `${kindLabel} - ${name.trim()}`;
  }
  return kindLabel;
}

interface FormValues {
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  kind: UsahaKind;
  status: UsahaPublishStatus;
  operational_status: UsahaOperationalStatus;
  region_id: string;
  village_id?: string | null;
  address_text?: string;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  social_url?: string;
  cover_url?: string | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export const USAHA_KIND_OPTIONS: Array<{ value: UsahaKind; label: string }> = [
  { value: 'product', label: 'Produk' },
  { value: 'service', label: 'Jasa' },
  { value: 'both', label: 'Produk dan jasa' },
];

export const USAHA_PUBLISH_STATUS_OPTIONS: Array<{
  value: UsahaPublishStatus;
  label: string;
}> = [
  { value: 'published', label: 'Tayang' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Diarsipkan' },
  { value: 'restricted', label: 'Dibatasi' },
];

export const USAHA_OPERATIONAL_STATUS_OPTIONS: Array<{
  value: UsahaOperationalStatus;
  label: string;
}> = [
  { value: 'unknown', label: 'Belum diketahui' },
  { value: 'open', label: 'Buka' },
  { value: 'temporarily_closed', label: 'Tutup sementara' },
  { value: 'permanently_closed', label: 'Tutup permanen' },
];

function CoverField({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (url: string | null) => void;
}) {
  const { message } = AntdApp.useApp();
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState('');

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    setUploading(true);
    uploadUsahaImage(file as File)
      .then((url) => onChange?.(url))
      .catch((err) => message.error(normalizeError(err).message || 'Gagal mengunggah foto'))
      .finally(() => setUploading(false));
    return false;
  };

  const addUrl = () => {
    const url = draft.trim();
    if (!url.startsWith('https://')) {
      message.warning('URL foto harus https');
      return;
    }
    onChange?.(url);
    setDraft('');
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {value ? (
        <div style={{ position: 'relative', width: 160, height: 120 }}>
          <Image src={value} width={160} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
          <Button
            size="small"
            danger
            shape="circle"
            icon={<DeleteOutlined />}
            style={{ position: 'absolute', top: -8, right: -8 }}
            onClick={() => onChange?.(null)}
          />
        </div>
      ) : null}
      <Upload
        accept="image/jpeg,image/png,image/webp"
        showUploadList={false}
        beforeUpload={beforeUpload}
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          {value ? 'Ganti foto' : 'Unggah foto'}
        </Button>
      </Upload>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Atau tempel URL https"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={addUrl}
        />
        <Button onClick={addUrl}>Pakai URL</Button>
      </Space.Compact>
    </Space>
  );
}

export function UsahaDrawer({
  open,
  onClose,
  onSaved,
  editing,
  submit,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Usaha | null;
  submit: (values: UsahaInput | ({ id: string } & Partial<UsahaInput>)) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const regionId = Form.useWatch('region_id', form);
  const regions = useAllRegions(open);
  const categories = useUsahaCategories(open);

  const kecamatanList = (regions.data ?? []).filter((r) => r.type === 'kecamatan');
  const desaList = (regions.data ?? []).filter((r) => r.type === 'desa');

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      editing
        ? {
            name: editing.name,
            slug: editing.slug,
            description: editing.description ?? undefined,
            category_id: editing.categoryId ?? undefined,
            kind: editing.kind,
            status: editing.publishStatus,
            operational_status: editing.operationalStatus,
            region_id: editing.regionId ?? undefined,
            village_id: editing.villageId ?? undefined,
            address_text: editing.addressText ?? undefined,
            lat: editing.lat,
            lng: editing.lng,
            maps_url: editing.mapsUrl ?? undefined,
            phone: editing.phone ?? undefined,
            whatsapp: editing.whatsapp ?? undefined,
            website: editing.website ?? undefined,
            social_url: editing.socialUrl ?? undefined,
            cover_url: editing.coverUrl ?? undefined,
          }
        : {
            name: '',
            slug: '',
            kind: 'product',
            status: 'published',
            operational_status: 'unknown',
          },
    );
  }, [open, editing, form]);

  const handleFinish = async (values: FormValues) => {
    const desa = desaList.find((d) => d.id === values.village_id);
    if (values.village_id && desa?.parentId && desa.parentId !== values.region_id) {
      message.error('Desa itu tidak ada di kecamatan yang dipilih');
      return;
    }
    if ((values.lat == null) !== (values.lng == null)) {
      message.error('Latitude dan longitude harus diisi berpasangan');
      return;
    }

    setSaving(true);
    try {
      const payload: UsahaInput = {
        slug: values.slug.trim() || slugify(values.name),
        name: values.name.trim(),
        description: values.description?.trim() || null,
        category_id: values.category_id ?? null,
        kind: values.kind,
        region_id: values.region_id,
        village_id: values.village_id ?? null,
        address_text: values.address_text?.trim() || null,
        lat: values.lat ?? null,
        lng: values.lng ?? null,
        maps_url: values.maps_url?.trim() || null,
        phone: values.phone?.trim() || null,
        whatsapp: values.whatsapp?.trim() || null,
        website: values.website?.trim() || null,
        social_url: values.social_url?.trim() || null,
        cover_url: values.cover_url ?? null,
        publish_status: values.status,
        operational_status: values.operational_status,
      };
      if (editing) {
        await submit({ id: editing.id, ...payload });
        message.success('Usaha diperbarui');
      } else {
        await submit(payload);
        message.success('Usaha dibuat');
      }
      onSaved();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const onFinishFailed: FormProps<FormValues>['onFinishFailed'] = () => {
    message.warning('Isian yang ditandai merah belum lengkap');
  };

  const kecOptions = kecamatanList.map((k) => ({ value: k.id, label: k.name }));
  const desaOptions = desaList
    .filter((d) => d.parentId === regionId)
    .map((d) => ({ value: d.id, label: d.name }));

  return (
    <Drawer
      title={editing ? 'Edit usaha' : 'Usaha baru'}
      open={open}
      onClose={onClose}
      width="min(880px, 100vw)"
      destroyOnClose
      styles={{ body: { paddingTop: 16 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Simpan
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={onFinishFailed}
        requiredMark="optional"
      >
        {editing?.publishStatus === 'restricted' ? (
          <Typography.Paragraph>
            <Tag color="red">Dibatasi</Tag> {editing.restrictedReason ?? 'Tanpa alasan tercatat'}
          </Typography.Paragraph>
        ) : null}

        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Identitas
        </Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item name="name" label="Nama usaha" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input
                onBlur={(e) => {
                  if (!editing && !form.getFieldValue('slug')) {
                    form.setFieldValue('slug', slugify(e.target.value));
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item name="slug" label="Slug" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input disabled={!!editing} placeholder="slug-usaha" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="category_id" label="Kategori">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Pilih kategori"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="kind" label="Jenis" rules={[{ required: true }]}>
              <Select options={USAHA_KIND_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="status" label="Status publikasi" rules={[{ required: true }]}>
              <Select options={USAHA_PUBLISH_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="operational_status" label="Status operasional" rules={[{ required: true }]}>
              <Select options={USAHA_OPERATIONAL_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Deskripsi">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5}>Lokasi</Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="region_id" label="Kecamatan" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={kecOptions}
                placeholder="Pilih kecamatan"
                onChange={() => form.setFieldValue('village_id', undefined)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="village_id" label="Desa">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={desaOptions}
                disabled={!regionId}
                placeholder={regionId ? 'Pilih desa' : 'Pilih kecamatan dulu'}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address_text" label="Alamat / petunjuk lokasi">
              <Input placeholder="Jalan, nomor, atau patokan" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="lat" label="Latitude">
              <Input type="number" step="0.0001" placeholder="1.3617" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="lng" label="Longitude">
              <Input type="number" step="0.0001" placeholder="109.313" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="maps_url" label="Google Maps URL">
              <Input placeholder="https://maps.app.goo.gl/..." />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5}>Kontak</Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Telepon">
              <Input placeholder="0812xxxxxxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="whatsapp" label="WhatsApp">
              <Input placeholder="62812xxxxxxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="website" label="Website">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="social_url" label="Media sosial">
              <Input placeholder="https://instagram.com/..." />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="cover_url" label="Foto utama" extra="Unggah file (dikompres) atau tempel URL https.">
              <CoverField />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {editing ? <UsahaChangeHistory usahaId={editing.id} /> : null}
    </Drawer>
  );
}

/** Riwayat pengajuan perubahan untuk usaha ini (admin saja). */
function UsahaChangeHistory({ usahaId }: { usahaId: string }) {
  const history = useUsahaContributionHistory(usahaId);
  const rows = history.data ?? [];

  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Riwayat perubahan
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Semua usulan warga dan pengelola untuk usaha ini (termasuk yang ditolak).
      </Typography.Paragraph>
      {history.isLoading ? <Spin size="small" /> : null}
      {history.isError ? (
        <Typography.Text type="danger">
          Gagal memuat riwayat: {normalizeError(history.error).message}
        </Typography.Text>
      ) : null}
      {!history.isLoading && !history.isError && rows.length === 0 ? (
        <Typography.Text type="secondary">Belum ada pengajuan perubahan.</Typography.Text>
      ) : null}
      {rows.length > 0 ? (
        <Timeline
          items={rows.map((row) => ({
            color:
              row.status === 'approved'
                ? 'green'
                : row.status === 'rejected'
                  ? 'red'
                  : 'gray',
            children: (
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space wrap size={6}>
                  <Typography.Text strong>{historySummary(row)}</Typography.Text>
                  <Tag color={HISTORY_STATUS_COLOR[row.status]}>
                    {USAHA_CONTRIBUTION_STATUS_LABEL[row.status]}
                  </Tag>
                </Space>
                <Typography.Text type="secondary">
                  Diajukan {formatDateTime(row.createdAt)}
                  {row.reviewedAt
                    ? ` · Ditinjau ${formatDateTime(row.reviewedAt)}`
                    : ''}
                </Typography.Text>
                {row.rejectReasonCode ? (
                  <Typography.Text type="secondary">
                    Tolak: {row.rejectReasonCode}
                    {row.rejectReasonText ? ` - ${row.rejectReasonText}` : ''}
                  </Typography.Text>
                ) : null}
                {row.revisionNote ? (
                  <Typography.Text type="secondary">
                    Revisi: {row.revisionNote}
                  </Typography.Text>
                ) : null}
                {row.kind === 'profile' && Object.keys(row.payload).length > 0 ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {Object.entries(row.payload)
                      .filter(([k]) => row.fields.length === 0 || row.fields.includes(k))
                      .map(([k, v]) => {
                        const label = USAHA_FIELD_LABEL[k] ?? k;
                        const text =
                          v == null
                            ? '-'
                            : typeof v === 'object'
                              ? JSON.stringify(v)
                              : String(v);
                        return `${label}: ${text}`;
                      })
                      .join(' · ')}
                  </Typography.Text>
                ) : null}
              </Space>
            ),
          }))}
        />
      ) : null}
    </div>
  );
}
