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
  Typography,
} from 'antd';
import type { FormProps } from 'antd';
import { normalizeError } from '@/shared/api/error';
import { useAllRegions } from '@/features/regions/application/use-regions';
import { useEventCategories } from '../application/use-events';
import type { Event, EventSourceType, EventStatus } from '../domain/event';
import type { EventInput } from '../infrastructure/event-api';
import { EVENT_SOURCE_TYPE_OPTIONS } from '../infrastructure/event-contribution-api';

interface FormValues {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  status: EventStatus;
  starts_at: string;
  ends_at: string;
  location_text: string;
  region_id?: string;
  village_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string;
  poster_url?: string;
  organizer?: string;
  source_url?: string;
  source_type?: EventSourceType | null;
  source_attribution?: string;
  place_ids?: string[];
}

/** `datetime-local` butuh "YYYY-MM-DDTHH:mm" (tanpa detik + offset). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Dari "YYYY-MM-DDTHH:mm" (lokal) ke ISO UTC. */
function toIso(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
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

export function EventDrawer({
  open,
  onClose,
  onSaved,
  editing,
  placeCatalog,
  submit,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Event | null;
  /** Katalog tourist spot untuk multi-select relasi. */
  placeCatalog: Array<{ id: string; name: string }>;
  submit: (values: EventInput | ({ id: string } & Partial<EventInput>)) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const regionId = Form.useWatch('region_id', form);
  const regions = useAllRegions(open);
  const categories = useEventCategories(open);

  const kecamatanList = (regions.data ?? []).filter((r) => r.type === 'kecamatan');
  const desaList = (regions.data ?? []).filter((r) => r.type === 'desa');

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      editing
        ? {
            name: editing.name,
            slug: editing.slug,
            description: editing.description,
            category_id: editing.categoryId,
            status: editing.status,
            starts_at: toLocalInput(editing.startsAt),
            ends_at: toLocalInput(editing.endsAt),
            location_text: editing.locationText,
            region_id: editing.regionId ?? undefined,
            village_id: editing.villageId ?? undefined,
            lat: editing.lat,
            lng: editing.lng,
            maps_url: editing.mapsUrl ?? undefined,
            poster_url: editing.posterUrl ?? undefined,
            organizer: editing.organizer ?? undefined,
            source_url: editing.sourceUrl ?? undefined,
            source_type: editing.sourceType ?? undefined,
            source_attribution: editing.sourceAttribution ?? undefined,
            place_ids: editing.places.map((p) => p.id),
          }
        : {
            name: '',
            slug: '',
            description: '',
            category_id: 'budaya-tradisi',
            status: 'published',
            starts_at: '',
            ends_at: '',
            location_text: '',
            place_ids: [],
          },
    );
  }, [open, editing, form]);

  const handleFinish = async (values: FormValues) => {
    const startsAt = toIso(values.starts_at);
    const endsAt = toIso(values.ends_at);
    if (!startsAt || !endsAt) {
      message.error('Tanggal mulai dan selesai wajib diisi');
      return;
    }
    if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      message.error('Waktu selesai tidak boleh sebelum waktu mulai');
      return;
    }
    const desa = desaList.find((d) => d.id === values.village_id);
    if (values.village_id && desa?.parentId && desa.parentId !== values.region_id) {
      message.error('Desa itu tidak ada di kecamatan yang dipilih');
      return;
    }

    setSaving(true);
    try {
      const payload: EventInput = {
        slug: values.slug.trim() || slugify(values.name),
        name: values.name.trim(),
        description: values.description.trim(),
        category_id: values.category_id,
        starts_at: startsAt,
        ends_at: endsAt,
        location_text: values.location_text.trim(),
        lat: values.lat ?? null,
        lng: values.lng ?? null,
        maps_url: values.maps_url?.trim() || null,
        poster_url: values.poster_url?.trim() || null,
        organizer: values.organizer?.trim() || null,
        source_url: values.source_url?.trim() || null,
        source_type: values.source_type ?? null,
        source_attribution: values.source_attribution?.trim() || null,
        region_id: values.region_id?.trim() || null,
        village_id: values.village_id?.trim() || null,
        place_ids: values.place_ids ?? [],
        status: values.status,
      };
      if (editing) {
        await submit({ id: editing.id, ...payload });
        message.success('Acara diperbarui');
      } else {
        await submit(payload);
        message.success('Acara dibuat');
      }
      onSaved();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const onFinishFailed: FormProps<FormValues>['onFinishFailed'] = (info) => {
    message.warning('Isian yang ditandai merah belum lengkap');
    void info;
  };

  const kecOptions = kecamatanList.map((k) => ({ value: k.id, label: k.name }));
  const desaOptions = desaList
    .filter((d) => d.parentId === regionId)
    .map((d) => ({ value: d.id, label: d.code ? `${d.name} (${d.code})` : d.name }));

  return (
    <Drawer
      title={editing ? 'Edit acara' : 'Acara baru'}
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
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Identitas
        </Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item name="name" label="Nama acara" rules={[{ required: true, message: 'Wajib diisi' }]}>
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
              <Input disabled={!!editing} placeholder="pawai-blocks-2026" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="category_id" label="Kategori" rules={[{ required: true, message: 'Pilih kategori' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder={categories.isLoading ? 'Memuat...' : 'Pilih kategori'}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Deskripsi" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input.TextArea rows={5} />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5}>Jadwal</Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="starts_at" label="Mulai" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="ends_at" label="Selesai" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5}>Lokasi</Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="region_id" label="Kecamatan">
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
            <Form.Item name="location_text" label="Lokasi acara" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input placeholder="Lapangan utama Pemangkat" />
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
          <Col xs={24} md={12}>
            <Form.Item name="maps_url" label="Google Maps URL">
              <Input placeholder="https://maps.app.goo.gl/..." />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="place_ids" label="Wisata terkait">
              <Select
                mode="multiple"
                allowClear
                showSearch
                optionFilterProp="label"
                options={placeCatalog.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Pilih wisata yang berkaitan"
              />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5}>Sumber & poster</Typography.Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="organizer" label="Penyelenggara">
              <Input placeholder="Panitia Pawai Blocks Keywords 2026" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="poster_url" label="URL poster">
              <Input placeholder="https://... (hasil /api/v1/images)" />
            </Form.Item>
          </Col>
          <Col xs={24} md={14}>
            <Form.Item
              name="source_url"
              label="Link sumber resmi"
              extra="Disimpan bersih tanpa UTM. UTM ditambahkan saat link dibuka."
            >
              <Input placeholder="https://facebook.com/..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item name="source_type" label="Platform sumber">
              <Select allowClear options={EVENT_SOURCE_TYPE_OPTIONS} placeholder="Pilih platform" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="source_attribution" label="Kredit sumber">
              <Input placeholder="@nama_akun atau Panitia Pawai" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
