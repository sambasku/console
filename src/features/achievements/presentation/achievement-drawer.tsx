import { useEffect, useRef, useState } from 'react';
import {
  App as AntdApp,
  Button,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { normalizeError } from '@/shared/api/error';
import {
  isLottieAssetFile,
  uploadAchievementAssetToCdn,
  uploadAchievementLottieToGithub,
} from '@/shared/api/achievement-asset-upload';
import {
  AchievementAssetPreview,
  type BadgeAssetKind,
} from './achievement-asset-preview';
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  REWARD_TYPE_LABELS,
  type Achievement,
  type AchievementCategory,
  type RewardType,
} from '../domain/achievement';

interface FormValues {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  reward_type: RewardType;
  badge_url: string;
  badge_asset_kind: BadgeAssetKind;
  source: string;
  threshold: number | null;
  window_from?: Dayjs | null;
  window_to?: Dayjs | null;
  /** Filter entity_type untuk contributions_approved. */
  filter_entity_type?: string | null;
  /** Filter role_in untuk user_role (multi → string pisah koma di wire). */
  filter_role_in?: string[] | null;
  family: string;
  level: number | null;
  is_active: boolean;
}

/**
 * Source kriteria - cerminan registry backend
 * (`api/src/modules/achievement/domain/achievement-registry.ts`).
 * Backend menolak source yang tidak dikenal / field yang tidak didukung
 * (ACHIEVEMENT_ENHANCEMENT P0-3). Daftar di sini harus 1:1 dengan registry.
 */
const SOURCE_OPTIONS: Array<{
  value: string;
  label: string;
  supportsThreshold: boolean;
  supportsWindow: boolean;
  /** Filter tertutup per source (cermin registry filterFields). */
  filterFields?: Array<{ key: string; label: string; options: string[] }>;
}> = [
  {
    value: 'registration',
    label: 'Kohort pendaftaran (tanggal registrasi)',
    supportsThreshold: false,
    supportsWindow: true,
  },
  {
    value: 'manual',
    label: 'Manual (diberikan admin)',
    supportsThreshold: false,
    supportsWindow: false,
  },
  {
    value: 'user_role',
    label: 'Memiliki role',
    supportsThreshold: false,
    supportsWindow: false,
    filterFields: [
      {
        key: 'role_in',
        label: 'Role',
        options: ['contributor', 'editor', 'reviewer', 'admin', 'root'],
      },
    ],
  },
  {
    value: 'contributions_approved',
    label: 'Kontribusi disetujui',
    supportsThreshold: true,
    supportsWindow: true,
    filterFields: [
      {
        key: 'entity_type',
        label: 'Jenis kontribusi',
        options: ['word', 'pronunciation', 'word_image', 'word_audio', 'example', 'meaning'],
      },
    ],
  },
  {
    value: 'verifications_done',
    label: 'Verifikasi dilakukan',
    supportsThreshold: true,
    supportsWindow: true,
  },
  {
    value: 'comments_published',
    label: 'Komentar tayang',
    supportsThreshold: true,
    supportsWindow: true,
  },
  {
    value: 'discussions_created',
    label: 'Diskusi disetujui',
    supportsThreshold: true,
    supportsWindow: true,
  },
  {
    value: 'discussion_replies_published',
    label: 'Balasan diskusi tayang',
    supportsThreshold: true,
    supportsWindow: true,
  },
  {
    value: 'articles_published',
    label: 'Artikel terbit',
    supportsThreshold: true,
    supportsWindow: true,
  },
];

function sourceMeta(source: string | undefined) {
  return SOURCE_OPTIONS.find((s) => s.value === source) ?? null;
}

/** Wire `role_in` (pisah koma) → multi Select value. */
function parseRoleInList(raw: string | null | undefined): string[] | null {
  if (!raw?.trim()) return null;
  const roles = raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  return roles.length > 0 ? roles : null;
}

/** Dayjs -> ISO 8601 dengan offset WIB (+07:00), tanpa plugin utcOffset. */
function toIsoWithOffset(d: Dayjs): string {
  // Geser 7 jam ke depan = WIB; format manual supaya offset eksplisit.
  const wib = new Date(d.valueOf() + 7 * 60 * 60 * 1000);
  return `${wib.toISOString().slice(0, 19)}+07:00`;
}

function fromIso(value: string): Dayjs | undefined {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

const ACHIEVEMENT_ASSET_ACCEPT_IMAGE =
  'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';

/** macOS sering kosongkan MIME .lottie; sertakan zip/octet-stream agar dialog file tetap menampilkan file. */
const ACHIEVEMENT_ASSET_ACCEPT_LOTTIE =
  '.json,.lottie,application/json,text/json,application/zip,application/octet-stream';

const ACHIEVEMENT_FORM_DEFAULTS: Partial<FormValues> = {
  category: 'kohort',
  reward_type: 'profile_border',
  badge_asset_kind: 'image',
  source: 'registration',
  threshold: null,
  filter_entity_type: null,
  filter_role_in: null,
  family: '',
  level: null,
  is_active: true,
};

/** Drawer buat/edit pencapaian. Kriteria = source + window + threshold. */
export function AchievementDrawer({
  open,
  onClose,
  onSaved,
  editing,
  submit,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Achievement | null;
  submit: (values: {
    code: string;
    title: string;
    description: string;
    category: AchievementCategory;
    reward_type: RewardType;
    badge_url: string | null;
    badge_asset_kind: BadgeAssetKind;
    criteria: {
      source: string;
      threshold?: number | null;
      window?: { from: string; to: string } | null;
      filters?: Record<string, string> | null;
    };
    family?: string | null;
    level?: number | null;
    is_active?: boolean;
  }) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreviewFile, setLocalPreviewFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const localPreviewUrlRef = useRef<string | null>(null);
  const source = Form.useWatch('source', form);
  const badgeUrl = Form.useWatch('badge_url', form);
  const badgeAssetKind = Form.useWatch('badge_asset_kind', form) ?? 'image';
  const rewardType = Form.useWatch('reward_type', form);

  useEffect(() => {
    if (open) return;
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
    }
    setLocalPreviewFile(null);
    setLocalPreviewUrl(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const criteria = editing?.criteria;
    form.setFieldsValue(
      editing
        ? {
            code: editing.code,
            title: editing.title,
            description: editing.description,
            category: editing.category,
            reward_type: editing.rewardType,
            badge_url: editing.badgeUrl ?? '',
            badge_asset_kind: editing.badgeAssetKind ?? 'image',
            source: criteria?.source ?? 'registration',
            threshold: criteria?.threshold ?? null,
            window_from: criteria?.window?.from ? fromIso(criteria.window.from) : undefined,
            window_to: criteria?.window?.to ? fromIso(criteria.window.to) : undefined,
            filter_entity_type: criteria?.filters?.entity_type ?? null,
            filter_role_in: parseRoleInList(criteria?.filters?.role_in),
            family: editing.family ?? '',
            level: editing.level ?? null,
            is_active: editing.isActive,
          }
        : {
            code: '',
            title: '',
            description: '',
            badge_url: '',
            window_from: undefined,
            window_to: undefined,
            ...ACHIEVEMENT_FORM_DEFAULTS,
          },
    );
  }, [open, editing, form]);

  useEffect(() => {
    if (rewardType && rewardType !== 'profile_border') {
      form.setFieldValue('badge_asset_kind', 'image');
    }
  }, [rewardType, form]);

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      const meta = sourceMeta(values.source);
      const needsWindow = meta?.supportsWindow === true;
      const needsThreshold = meta?.supportsThreshold === true;
      const hasWindow = needsWindow && values.window_from && values.window_to;
      const filters: Record<string, string> = {};
      if (meta?.filterFields?.some((f) => f.key === 'entity_type') && values.filter_entity_type) {
        filters.entity_type = values.filter_entity_type;
      }
      if (meta?.filterFields?.some((f) => f.key === 'role_in')) {
        const roles = (values.filter_role_in ?? []).map((r) => r.trim()).filter(Boolean);
        if (roles.length > 0) {
          filters.role_in = roles.join(',');
        }
      }
      await submit({
        code: values.code.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        reward_type: values.reward_type,
        badge_url: values.badge_url?.trim() || null,
        badge_asset_kind: values.badge_asset_kind ?? 'image',
        criteria: {
          source: values.source,
          // Jangan kirim threshold/window bila source tidak support - API menolak.
          threshold: needsThreshold ? (values.threshold ?? null) : null,
          window: hasWindow
            ? { from: toIsoWithOffset(values.window_from!), to: toIsoWithOffset(values.window_to!) }
            : null,
          filters: Object.keys(filters).length > 0 ? filters : null,
        },
        family: values.family?.trim() || null,
        level: values.level ?? null,
        is_active: values.is_active,
      });
      message.success(editing ? 'Pencapaian diperbarui' : 'Pencapaian dibuat');
      onSaved();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? 'Edit pencapaian' : 'Pencapaian baru'}
      width={520}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={ACHIEVEMENT_FORM_DEFAULTS}
      >
        <Form.Item
          name="code"
          label="Kode"
          extra="Slug stabil, dipakai integrasi. Huruf kecil, angka, dan hyphen. Tidak bisa diubah setelah dibuat."
          rules={[
            { required: true, message: 'Wajib diisi' },
            { pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: 'Huruf kecil, angka, dan hyphen' },
          ]}
        >
          <Input placeholder="Mis. angkatan-ke-1" disabled={!!editing} />
        </Form.Item>
        <Form.Item
          name="title"
          label="Judul"
          rules={[
            { required: true, message: 'Wajib diisi' },
            { min: 3, max: 80, message: '3-80 karakter' },
          ]}
        >
          <Input placeholder="Mis. Angkatan Ke-1" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Deskripsi"
          rules={[
            { required: true, message: 'Wajib diisi' },
            { min: 3, max: 500, message: '3-500 karakter' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Penjelasan singkat untuk user" />
        </Form.Item>
        <Form.Item name="category" label="Kategori" rules={[{ required: true }]}>
          <Select
            options={Object.entries(ACHIEVEMENT_CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
        <Form.Item name="reward_type" label="Jenis reward" rules={[{ required: true }]}>
          <Select
            options={Object.entries(REWARD_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        <Form.Item
          name="badge_asset_kind"
          label="Jenis aset"
          extra="Lottie untuk border animasi (.json atau .lottie). Badge/stiker tetap gambar."
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 'image', label: 'Gambar (PNG/WebP)' },
              { value: 'lottie', label: 'Lottie animasi' },
            ]}
            disabled={rewardType !== 'profile_border'}
          />
        </Form.Item>
        <Form.Item
          name="badge_url"
          label="URL aset (opsional)"
          extra="Tempel URL, atau unggah dari komputer. Aset tersimpan di CDN."
        >
          <Input placeholder="https://cdn.jsdelivr.net/gh/sambasku/images@main/assets/achievements/..." />
        </Form.Item>
        <Form.Item
          label="Unggah aset"
          extra={
            badgeAssetKind === 'lottie'
              ? 'JSON atau .lottie diunggah ke repo GitHub (jsDelivr). Maks 2 MB. PNG tetap ImageKit.'
              : 'PNG/JPEG/WebP. Maks 2 MB.'
          }
        >
          <input
            key={badgeAssetKind === 'lottie' ? 'lottie' : 'image'}
            type="file"
            accept={
              badgeAssetKind === 'lottie'
                ? ACHIEVEMENT_ASSET_ACCEPT_LOTTIE
                : ACHIEVEMENT_ASSET_ACCEPT_IMAGE
            }
            style={{ display: 'block' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;

              const kind =
                badgeAssetKind === 'lottie'
                  ? 'lottie'
                  : ((form.getFieldValue('badge_asset_kind') as BadgeAssetKind) ?? 'image');
              const fileIsLottie = await isLottieAssetFile(file);
              if (rewardType === 'profile_border' && fileIsLottie) {
                form.setFieldValue('badge_asset_kind', 'lottie');
              }
              if (localPreviewUrlRef.current) {
                URL.revokeObjectURL(localPreviewUrlRef.current);
              }
              const blobUrl = URL.createObjectURL(file);
              localPreviewUrlRef.current = blobUrl;
              setLocalPreviewFile(file);
              setLocalPreviewUrl(blobUrl);

              setUploading(true);
              try {
                const uploadKind: BadgeAssetKind =
                  kind === 'lottie' || fileIsLottie ? 'lottie' : 'image';
                const { url } =
                  uploadKind === 'lottie'
                    ? await uploadAchievementLottieToGithub(file)
                    : await uploadAchievementAssetToCdn(file, '/achievements', 'image');
                form.setFieldValue('badge_url', url);
                if (uploadKind === 'lottie') {
                  form.setFieldValue('badge_asset_kind', 'lottie');
                }
                if (localPreviewUrlRef.current) {
                  URL.revokeObjectURL(localPreviewUrlRef.current);
                  localPreviewUrlRef.current = null;
                }
                setLocalPreviewFile(null);
                setLocalPreviewUrl(null);
                message.success(
                  uploadKind === 'lottie'
                    ? 'Lottie tersimpan di repo GitHub (jsDelivr)'
                    : 'Gambar terunggah ke ImageKit',
                );
              } catch (err) {
                message.error(normalizeError(err).message);
              } finally {
                setUploading(false);
              }
            }}
          />
          {uploading ? <Typography.Text type="secondary">Mengunggah...</Typography.Text> : null}
        </Form.Item>
        {badgeUrl || localPreviewUrl ? (
          <Form.Item
            label="Pratinjau"
            extra={
              localPreviewUrl && !badgeUrl
                ? 'Pratinjau lokal - selesai unggah untuk URL jsDelivr.'
                : undefined
            }
          >
            <AchievementAssetPreview
              url={localPreviewUrl ?? badgeUrl ?? ''}
              assetKind={
                localPreviewFile &&
                (badgeAssetKind === 'lottie' ||
                  localPreviewFile.name.toLowerCase().endsWith('.json') ||
                  localPreviewFile.name.toLowerCase().endsWith('.lottie'))
                  ? 'lottie'
                  : badgeAssetKind
              }
              fileName={localPreviewFile?.name}
              size={120}
            />
          </Form.Item>
        ) : null}
        <Typography.Title level={5}>Kriteria</Typography.Title>
        <Form.Item
          name="source"
          label="Sumber"
          extra="Sumber yang bisa dipilih terbatas. Source baru harus ditambah di registry backend dulu."
          rules={[{ required: true }]}
        >
          <Select options={SOURCE_OPTIONS} />
        </Form.Item>
        {sourceMeta(source)?.supportsThreshold ? (
          <Form.Item
            name="threshold"
            label="Ambang minimum"
            extra="Kosong = minimal 1 (default mesin agregat)."
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Mis. 10" />
          </Form.Item>
        ) : null}
        {sourceMeta(source)?.filterFields?.some((f) => f.key === 'entity_type') ? (
          <Form.Item
            name="filter_entity_type"
            label="Jenis kontribusi (opsional)"
            extra="Kosong = semua jenis yang disetujui."
          >
            <Select
              allowClear
              placeholder="Semua jenis"
              options={(sourceMeta(source)?.filterFields?.find((f) => f.key === 'entity_type')
                ?.options ?? []
              ).map((value) => ({ value, label: value }))}
            />
          </Form.Item>
        ) : null}
        {sourceMeta(source)?.filterFields?.some((f) => f.key === 'role_in') ? (
          <Form.Item
            name="filter_role_in"
            label="Role"
            extra="Verifikator di wire = reviewer. Minimal satu role."
            rules={[{ required: true, type: 'array', min: 1, message: 'Pilih minimal satu role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Pilih role"
              options={(sourceMeta(source)?.filterFields?.find((f) => f.key === 'role_in')
                ?.options ?? []
              ).map((value) => ({
                value,
                label:
                  value === 'reviewer'
                    ? 'reviewer (verifikator)'
                    : value,
              }))}
            />
          </Form.Item>
        ) : null}
        {sourceMeta(source)?.supportsWindow ? (
          <Flex gap={8}>
            <Form.Item
              name="window_from"
              label="Mulai"
              style={{ flex: 1 }}
              rules={
                source === 'registration'
                  ? [{ required: true, message: 'Wajib diisi' }]
                  : undefined
              }
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="window_to"
              label="Selesai"
              style={{ flex: 1 }}
              rules={[
                ...(source === 'registration'
                  ? [{ required: true, message: 'Wajib diisi' } as const]
                  : []),
                {
                  validator: async (_, value: Dayjs | null) => {
                    const from = form.getFieldValue('window_from') as Dayjs | undefined;
                    if (value && from && !value.isAfter(from)) {
                      throw new Error('Selesai harus setelah mulai');
                    }
                  },
                },
              ]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Flex>
        ) : null}

        <Form.Item
          name="family"
          label="Grup tier (opsional)"
          extra="Pencapaian dengan grup sama: hanya level tertinggi yang tampil di profil."
        >
          <Input placeholder="Mis. kata-disetujui" />
        </Form.Item>
        <Form.Item name="level" label="Level tier (opsional)">
          <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1 = paling rendah" />
        </Form.Item>
        <Form.Item
          name="is_active"
          label="Aktif"
          valuePropName="checked"
          extra="Nonaktif = berhenti diberikan otomatis. Yang sudah didapat tetap tampil."
        >
          <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
        </Form.Item>

        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {editing ? 'Simpan' : 'Buat'}
          </Button>
        </Flex>
      </Form>
    </Drawer>
  );
}
