import { useEffect, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { useCulinaryCategories } from '../application/use-culinary';
import type {
  Cuisine,
  CulinaryPlace,
  CulinaryPlaceType,
  CulinaryPublishStatus,
} from '../domain/culinary';
import {
  uploadCulinaryImage,
  type CuisineInput,
  type PlaceInput,
} from '../infrastructure/culinary-api';

export const CULINARY_PUBLISH_STATUS_OPTIONS: Array<{
  value: CulinaryPublishStatus;
  label: string;
}> = [
  { value: 'published', label: 'Tayang' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Diarsipkan' },
  { value: 'restricted', label: 'Dibatasi' },
];

export const CULINARY_OPERATIONAL_STATUS_OPTIONS: Array<{
  value: CulinaryPlace['operationalStatus'];
  label: string;
}> = [
  { value: 'unknown', label: 'Belum diketahui' },
  { value: 'operating', label: 'Buka' },
  { value: 'temporarily_closed', label: 'Tutup sementara' },
  { value: 'permanently_closed', label: 'Tutup permanen' },
];

export const CULINARY_PLACE_TYPE_OPTIONS: Array<{
  value: CulinaryPlaceType;
  label: string;
}> = [
  { value: 'restaurant', label: 'Restoran' },
  { value: 'warung', label: 'Warung' },
  { value: 'kedai', label: 'Kedai' },
  { value: 'market_stall', label: 'Lapak pasar' },
  { value: 'street_vendor', label: 'Pedagang keliling' },
  { value: 'home_industry', label: 'Industri rumahan' },
  { value: 'other', label: 'Lainnya' },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Editor gambar dengan atribusi wajib (PRD kuliner 13). */
export function CuisineImagesField({
  value = [],
  onChange,
}: {
  value?: CuisineInput['images'];
  onChange?: (next: NonNullable<CuisineInput['images']>) => void;
}) {
  const { message } = AntdApp.useApp();
  const [uploading, setUploading] = useState(false);
  const images = value ?? [];

  const upload: UploadProps['beforeUpload'] = (file) => {
    setUploading(true);
    uploadCulinaryImage(file as File)
      .then((url) =>
        onChange?.([...images, { url, is_main: images.length === 0, attribution: null }]),
      )
      .catch((err) => message.error(normalizeError(err).message || 'Gagal unggah foto'))
      .finally(() => setUploading(false));
    return false;
  };

  const patch = (index: number, next: Partial<NonNullable<CuisineInput['images']>[number]>) => {
    onChange?.(images.map((img, i) => (i === index ? { ...img, ...next } : img)));
  };

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      {images.map((img, i) => (
        <div key={`${img.url}-${i}`} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
          <Row gutter={8} align="middle">
            <Col flex="120px">
              <img
                src={img.url}
                alt=""
                style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }}
              />
            </Col>
            <Col flex="auto">
              <Input
                value={img.attribution?.name ?? ''}
                onChange={(e) =>
                  patch(i, {
                    attribution: { ...(img.attribution ?? {}), name: e.target.value },
                  })
                }
                placeholder="Nama pemilik gambar (wajib)"
              />
              <Input
                style={{ marginTop: 6 }}
                value={img.attribution?.license ?? ''}
                onChange={(e) =>
                  patch(i, {
                    attribution: { ...(img.attribution ?? {}), license: e.target.value },
                  })
                }
                placeholder="Lisensi, mis. CC BY-SA 4.0 (wajib)"
              />
              <Input
                style={{ marginTop: 6 }}
                value={img.attribution?.url ?? ''}
                onChange={(e) =>
                  patch(i, {
                    attribution: { ...(img.attribution ?? {}), url: e.target.value },
                  })
                }
                placeholder="URL sumber (opsional)"
              />
            </Col>
            <Col flex="90px">
              <Space direction="vertical">
                <Button
                  size="small"
                  type={img.is_main ? 'primary' : 'default'}
                  onClick={() => onChange?.(images.map((x, j) => ({ ...x, is_main: j === i })))}
                >
                  {img.is_main ? 'Utama' : 'Jadikan utama'}
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onChange?.(images.filter((_, j) => j !== i))}
                />
              </Space>
            </Col>
          </Row>
        </div>
      ))}
      <Space>
        <Upload beforeUpload={upload} showUploadList={false} accept="image/*">
          <Button icon={<UploadOutlined />} loading={uploading}>
            Unggah gambar
          </Button>
        </Upload>
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            const url = window.prompt('URL gambar https://');
            if (!url || !url.startsWith('https://')) return;
            onChange?.([...images, { url, is_main: images.length === 0, attribution: null }]);
          }}
        >
          Tempel URL
        </Button>
      </Space>
    </Space>
  );
}

interface CuisineFormValues {
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  origin_region?: string;
  ingredients?: string;
  serving_suggestion?: string;
  tags?: string;
  publish_status: CulinaryPublishStatus;
  images?: CuisineInput['images'];
}

interface PlaceFormValues {
  name: string;
  slug: string;
  type?: CulinaryPlaceType;
  description?: string;
  location_hint?: string;
  address_text?: string;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  social_url?: string;
  cover_url?: string;
  operational_status: CulinaryPlace['operationalStatus'];
  publish_status: CulinaryPublishStatus;
}

function splitList(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CuisineDrawer({
  open,
  editing,
  onClose,
  onSaved,
  submit,
}: {
  open: boolean;
  editing: Cuisine | null;
  onClose: () => void;
  onSaved: () => void;
  submit: (values: ({ id: string } & Partial<CuisineInput>) | CuisineInput) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<CuisineFormValues>();
  const [saving, setSaving] = useState(false);
  const categories = useCulinaryCategories(open);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        slug: editing.slug,
        description: editing.description ?? undefined,
        category_id: editing.categoryId ?? undefined,
        origin_region: editing.originRegion ?? undefined,
        ingredients: editing.ingredients.join(', '),
        serving_suggestion: editing.servingSuggestion ?? undefined,
        tags: editing.tags.join(', '),
        publish_status: editing.publishStatus,
        images: editing.images.map((img) => ({
          url: img.url,
          is_main: img.isMain,
          attribution: img.attribution,
        })),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ publish_status: 'published', images: [] });
    }
  }, [editing, form, open]);

  const handleFinish = async (values: CuisineFormValues) => {
    setSaving(true);
    try {
      const missing = (values.images ?? []).find(
        (img) => !img.attribution?.name?.trim() || !img.attribution?.license?.trim(),
      );
      if (missing) {
        message.error('Setiap gambar wajib punya nama pemilik dan lisensi');
        return;
      }
      const payload: CuisineInput = {
        name: values.name,
        slug: values.slug,
        description: values.description ?? null,
        category_id: values.category_id ?? null,
        origin_region: values.origin_region ?? null,
        images: (values.images ?? []).map((img) => ({
          url: img.url,
          is_main: img.is_main === true,
          attribution: img.attribution ?? null,
        })),
        ingredients: splitList(values.ingredients),
        serving_suggestion: values.serving_suggestion ?? null,
        tags: splitList(values.tags),
        publish_status: values.publish_status,
      };
      if (editing) {
        await submit({ id: editing.id, ...payload });
        message.success('Kuliner diperbarui');
      } else {
        await submit(payload);
        message.success('Kuliner dibuat');
      }
      onSaved();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? 'Edit kuliner' : 'Kuliner baru'}
      open={open}
      onClose={onClose}
      width="min(880px, 100vw)"
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Simpan
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        {editing?.publishStatus === 'restricted' ? (
          <Typography.Paragraph>
            <Tag color="red">Dibatasi</Tag> {editing.restrictedReason ?? 'Tanpa alasan tercatat'}
          </Typography.Paragraph>
        ) : null}
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item
              name="name"
              label="Nama kuliner"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
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
            <Form.Item
              name="slug"
              label="Slug"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <Input disabled={!!editing} placeholder="slug-kuliner" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="category_id" label="Kategori">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Pilih kategori"
                options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="origin_region" label="Daerah asal">
              <Input placeholder="Daerah asal" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="publish_status"
              label="Status publikasi"
              rules={[{ required: true }]}
            >
              <Select options={CULINARY_PUBLISH_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Deskripsi">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="ingredients" label="Bahan" extra="Pisahkan dengan koma.">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="serving_suggestion" label="Cara penyajian">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="tags" label="Tag" extra="Pisahkan dengan koma.">
              <Input placeholder="tradisional, pedas" />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5}>Gambar dan atribusi</Typography.Title>
        <Form.Item
          name="images"
          extra="Atribusi wajib: nama pemilik dan lisensi. Disimpan dan ditampilkan apa adanya."
        >
          <CuisineImagesField />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export function PlaceDrawer({
  open,
  editing,
  onClose,
  onSaved,
  submit,
}: {
  open: boolean;
  editing: CulinaryPlace | null;
  onClose: () => void;
  onSaved: () => void;
  submit: (values: ({ id: string } & Partial<PlaceInput>) | PlaceInput) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<PlaceFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        slug: editing.slug,
        type: editing.type ?? undefined,
        description: editing.description ?? undefined,
        location_hint: editing.locationHint ?? undefined,
        address_text: editing.addressText ?? undefined,
        lat: editing.lat ?? undefined,
        lng: editing.lng ?? undefined,
        maps_url: editing.mapsUrl ?? undefined,
        phone: editing.phone ?? undefined,
        whatsapp: editing.whatsapp ?? undefined,
        website: editing.website ?? undefined,
        social_url: editing.socialUrl ?? undefined,
        cover_url: editing.coverUrl ?? undefined,
        operational_status: editing.operationalStatus,
        publish_status: editing.publishStatus,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ publish_status: 'published', operational_status: 'unknown' });
    }
  }, [editing, form, open]);

  const handleFinish = async (values: PlaceFormValues) => {
    setSaving(true);
    try {
      const hasLat = values.lat != null && `${values.lat}` !== '';
      const hasLng = values.lng != null && `${values.lng}` !== '';
      if (hasLat !== hasLng) {
        message.error('Latitude dan longitude harus diisi berpasangan');
        return;
      }
      const payload: PlaceInput = {
        name: values.name,
        slug: values.slug,
        type: values.type ?? null,
        description: values.description ?? null,
        location_hint: values.location_hint ?? null,
        address_text: values.address_text ?? null,
        lat: hasLat ? Number(values.lat) : null,
        lng: hasLng ? Number(values.lng) : null,
        maps_url: values.maps_url ?? null,
        phone: values.phone ?? null,
        whatsapp: values.whatsapp ?? null,
        website: values.website ?? null,
        social_url: values.social_url ?? null,
        cover_url: values.cover_url ?? null,
        operational_status: values.operational_status,
        publish_status: values.publish_status,
      };
      if (editing) {
        await submit({ id: editing.id, ...payload });
        message.success('Tempat diperbarui');
      } else {
        await submit(payload);
        message.success('Tempat dibuat');
      }
      onSaved();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? 'Edit tempat' : 'Tempat baru'}
      open={open}
      onClose={onClose}
      width="min(880px, 100vw)"
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Simpan
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        {editing?.publishStatus === 'restricted' ? (
          <Typography.Paragraph>
            <Tag color="red">Dibatasi</Tag> {editing.restrictedReason ?? 'Tanpa alasan tercatat'}
          </Typography.Paragraph>
        ) : null}
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item
              name="name"
              label="Nama tempat"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
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
            <Form.Item
              name="slug"
              label="Slug"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <Input disabled={!!editing} placeholder="slug-tempat" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="type" label="Jenis tempat">
              <Select allowClear options={CULINARY_PLACE_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="publish_status"
              label="Status publikasi"
              rules={[{ required: true }]}
            >
              <Select options={CULINARY_PUBLISH_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="operational_status"
              label="Status operasional"
              rules={[{ required: true }]}
            >
              <Select options={CULINARY_OPERATIONAL_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Deskripsi">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="location_hint" label="Patokan lokasi">
              <Input placeholder="Ada di sekitar mana" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address_text" label="Alamat">
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
            <Form.Item name="cover_url" label="Foto utama">
              <Input placeholder="https://cdn.jsdelivr.net/..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
