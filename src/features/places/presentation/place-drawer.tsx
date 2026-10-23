import { useEffect, useRef, useState } from 'react';
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
  Steps,
  Typography,
  theme,
} from 'antd';
import type { FormProps } from 'antd';
import { normalizeError } from '@/shared/api/error';
import { useAllRegions } from '@/features/regions/application/use-regions';
import { useAllPlaceCategories } from '@/features/place-categories/application/use-place-categories';
import type { Place, PlaceCategory, PlaceStatus, PlaceType } from '../domain/place';
import type { PlaceInput } from '../infrastructure/place-api';
import { MapPointField } from '@/shared/map/map-point-field';
import { SAMBAS_BIAS, SAMBAS_CENTER } from '@/shared/map/presets';
import { PlaceImagesField, type PlaceImageDraft } from './place-images-field';

interface FormValues {
  slug: string;
  name: string;
  category: PlaceCategory;
  type?: PlaceType | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string;
  short_description: string;
  region_id?: string;
  village_id?: string | null;
  hours?: string;
  contact?: string;
  author_id?: string;
  related_places?: string[];
  related_usaha?: string[];
  status: PlaceStatus;
  images?: PlaceImageDraft[];
}

const STEPS = [
  { title: 'Identitas', fields: ['name', 'slug', 'category', 'type', 'status', 'short_description'] },
  { title: 'Lokasi', fields: ['region_id', 'village_id', 'lat', 'lng', 'maps_url', 'related_places', 'related_usaha'] },
  { title: 'Kontak', fields: ['hours', 'contact', 'author_id'] },
  { title: 'Foto', fields: ['images'] },
] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function draftsFromPlace(place: Place): PlaceImageDraft[] {
  return [...place.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({
      uid: img.id,
      url: img.url,
      isMain: img.isMain,
      attributionName: img.attribution?.name ?? '',
      attributionProvider: img.attribution?.provider ?? '',
      status: 'done' as const,
      fileName: img.url,
    }));
}

export function PlaceDrawer({
  open,
  onClose,
  onSaved,
  editing,
  catalog,
  submit,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Place | null;
  catalog: Array<{ slug: string; name: string }>;
  submit: (values: PlaceInput | ({ id: string } & Partial<PlaceInput>)) => Promise<unknown>;
}) {
  const { token } = theme.useToken();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const regionId = Form.useWatch('region_id', form);
  const category = Form.useWatch('category', form);
  const regions = useAllRegions(open);
  const categories = useAllPlaceCategories(open);
  const kecamatanList = (regions.data ?? []).filter((r) => r.type === 'kecamatan');
  const desaList = (regions.data ?? []).filter((r) => r.type === 'desa');
  const lastStep = STEPS.length - 1;

  useEffect(() => {
  if (!open) return;
  // reset step dipindah ke afterOpenChange (event), bukan effect
    form.setFieldsValue(
      editing
        ? {
            slug: editing.slug,
            name: editing.name,
            category: editing.category,
            type: editing.type,
            lat: editing.lat,
            lng: editing.lng,
            maps_url: editing.mapsUrl ?? undefined,
            short_description: editing.shortDescription,
            region_id: editing.regionId ?? undefined,
            village_id: editing.villageId ?? undefined,
            hours: editing.hours ?? undefined,
            contact: editing.contact ?? undefined,
            author_id: editing.authorId ?? undefined,
            related_places: editing.related.filter((r) => r.kind === 'place').map((r) => r.slug),
            related_usaha: editing.related.filter((r) => r.kind === 'usaha').map((r) => r.slug),
            status: editing.status,
            images: draftsFromPlace(editing),
          }
        : {
            slug: '',
            name: '',
            category: 'wisata',
            type: 'sejarah',
            status: 'published',
            short_description: '',
            region_id: undefined,
            village_id: undefined,
            images: [],
          },
    );
  }, [open, editing, form]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  const goTo = async (next: number) => {
    if (next === step) return;
    if (next < step) {
      setStep(next);
      return;
    }
    try {
      const fields = STEPS.slice(step, next).flatMap((s) => [...s.fields]);
      await form.validateFields(fields);
      setStep(next);
    } catch {
      /* antd menandai field yang gagal */
    }
  };

  const handleFinish = async (values: FormValues) => {
    const drafts = values.images ?? [];
    if (drafts.some((img) => img.status === 'uploading')) {
      message.warning('Tunggu unggahan foto selesai dulu');
      setStep(lastStep);
      return;
    }
    const failed = drafts.filter((img) => img.status === 'error');
    if (failed.length > 0) {
      message.warning('Ada foto yang gagal. Hapus baris itu atau unggah ulang.');
      setStep(lastStep);
      return;
    }
    const desa = desaList.find((d) => d.id === values.village_id);
    if (values.village_id && desa?.parentId && desa.parentId !== values.region_id) {
      message.error('Desa itu tidak ada di kecamatan yang dipilih');
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const images = drafts
        .filter((img) => img.url.startsWith('https://'))
        .map((img, i) => {
          const name = img.attributionName.trim();
          return {
            url: img.url.trim(),
            is_main: img.isMain,
            sort_order: i,
            attribution: name
              ? {
                  name,
                  provider: img.attributionProvider.trim() || 'sambasku',
                }
              : null,
          };
        });

      const payload: PlaceInput = {
        slug: values.slug.trim() || slugify(values.name),
        name: values.name.trim(),
        category: values.category,
        type: values.category === 'wisata' ? values.type ?? null : null,
        lat: values.lat ?? null,
        lng: values.lng ?? null,
        maps_url: values.maps_url?.trim() || null,
        short_description: values.short_description.trim(),
        region_id: values.region_id?.trim() || null,
        village_id: values.village_id?.trim() || null,
        hours: values.hours?.trim() || null,
        contact: values.contact?.trim() || null,
        author_id: values.author_id?.trim() || null,
        related: [
          ...(values.related_places ?? []).map((slug) => ({ kind: 'place' as const, slug })),
          ...(values.related_usaha ?? []).map((slug) => ({ kind: 'usaha' as const, slug })),
        ],
        status: values.status,
        images,
        sources: editing?.sources.map((s) => ({
          name: s.name,
          type: s.type,
          address: s.address,
          license: s.license,
          license_url: s.licenseUrl,
        })),
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

  const onFinishFailed: FormProps<FormValues>['onFinishFailed'] = (info) => {
    const names = new Set(info.errorFields.map((f) => String(f.name[0])));
    const idx = STEPS.findIndex((s) => s.fields.some((field) => names.has(field)));
    if (idx >= 0) setStep(idx);
  };

  const kecOptions = kecamatanList.map((k) => ({ value: k.id, label: k.name }));
  const extraRegion = editing?.regionId;
  if (extraRegion && !kecamatanList.some((k) => k.id === extraRegion)) {
    kecOptions.unshift({ value: extraRegion, label: extraRegion });
  }
  const desaOptions = desaList
    .filter((d) => d.parentId === regionId)
    .map((d) => ({
      value: d.id,
      label: d.code ? `${d.name} (${d.code})` : d.name,
    }));

  const panel = (index: number) => (step === index ? undefined : 'none');

  return (
    <Drawer
      title={editing ? 'Edit tempat' : 'Tempat baru'}
      open={open}
      onClose={onClose}
      afterOpenChange={(o) => {
        if (!o) setStep(0);
      }}
      width="min(1080px, 100vw)"
      destroyOnClose
      styles={{ body: { paddingTop: 16 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button onClick={onClose}>Batal</Button>
          <Space>
            {step > 0 ? <Button onClick={() => setStep((s) => s - 1)}>Kembali</Button> : null}
            {step < lastStep ? (
              <Button type="primary" onClick={() => void goTo(step + 1)}>
                Lanjut
              </Button>
            ) : null}
            <Button loading={saving} onClick={() => form.submit()} type={step === lastStep ? 'primary' : 'default'}>
              Simpan
            </Button>
          </Space>
        </div>
      }
    >
      <div ref={topRef} />
      <Steps
        current={step}
        onChange={(next) => void goTo(next)}
        items={STEPS.map((s) => ({ title: s.title }))}
        style={{
          marginBottom: 24,
          padding: '12px 16px',
          background: token.colorFillAlter,
          borderRadius: token.borderRadiusLG,
        }}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={onFinishFailed}
        requiredMark="optional"
      >
        <div style={{ display: panel(0) }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Identitas
          </Typography.Title>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item name="name" label="Nama" rules={[{ required: true, message: 'Wajib diisi' }]}>
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
                <Input disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="Kategori" rules={[{ required: true, message: 'Pilih kategori' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(categories.data ?? [])
                    .filter((c) => c.status === 'published' || c.id === editing?.category)
                    .map((c) => ({ value: c.id, label: c.name }))}
                  placeholder={categories.isLoading ? 'Memuat...' : 'Pilih kategori'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} style={{ display: category === 'wisata' ? undefined : 'none' }}>
              <Form.Item name="type" label="Tipe">
                <Select
                  allowClear
                  options={[
                    { value: 'sejarah', label: 'Sejarah' },
                    { value: 'alam', label: 'Alam' },
                    { value: 'budaya', label: 'Budaya' },
                    { value: 'pantai', label: 'Pantai' },
                    { value: 'belanja', label: 'Belanja' },
                  ]}
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
              <Form.Item
                name="short_description"
                label="Deskripsi singkat"
              >
                <Input.TextArea rows={5} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div style={{ display: panel(1) }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Lokasi
          </Typography.Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="region_id"
                label="Kecamatan"
                rules={[{ required: true, message: 'Pilih kecamatan' }]}
              >
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
              {step === 1 ? (
                <MapPointField defaultCenter={SAMBAS_CENTER} bias={SAMBAS_BIAS} height={360} />
              ) : null}
            </Col>
            <Col span={24}>
              <Form.Item name="related_places" label="Didekat sini (tempat)">
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={catalog
                    .filter((p) => p.slug !== editing?.slug)
                    .map((p) => ({ value: p.slug, label: p.name }))}
                  placeholder="Pilih tempat yang berdekatan"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="related_usaha" label="Didekat sini (usaha, slug)">
                <Select mode="tags" placeholder="Slug usaha, nanti diisi modul Usaha" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="maps_url" label="Google Maps URL">
                <Input placeholder="https://maps.app.goo.gl/..." />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div style={{ display: panel(2) }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Kontak
          </Typography.Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="hours" label="Jam buka">
                <Input placeholder="Setiap hari 08.00-17.00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contact" label="Kontak">
                <Input placeholder="Nomor, email, atau catatan" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="author_id" label="Author ID">
                <Input placeholder="id di contributors.json, mis. iamutaki" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div style={{ display: panel(3) }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Foto
          </Typography.Title>
          <Form.Item name="images">
            <PlaceImagesField />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}
