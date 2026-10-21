import { useEffect, useState } from 'react';
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
  source: string;
  threshold: number | null;
  window_from?: Dayjs | null;
  window_to?: Dayjs | null;
  family: string;
  level: number | null;
  is_active: boolean;
}

/**
 * Source kriteria - cerminan registry backend
 * (`api/src/modules/achievement/domain/achievement-registry.ts`).
 * Backend menolak source yang tidak dikenal, jadi daftar di sini harus
 * selalu sama dengan registry.
 */
const SOURCE_OPTIONS = [
  { value: 'registration', label: 'Kohort pendaftaran (tanggal registrasi)' },
  { value: 'manual', label: 'Manual (diberikan admin)' },
];

/** Source yang butuh rentang tanggal. */
const WINDOW_SOURCES = new Set(['registration']);

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
    criteria: {
      source: string;
      threshold?: number | null;
      window?: { from: string; to: string } | null;
    };
    family?: string | null;
    level?: number | null;
    is_active?: boolean;
  }) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const source = Form.useWatch('source', form);

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
            source: criteria?.source ?? 'registration',
            threshold: criteria?.threshold ?? null,
            window_from: criteria?.window?.from ? fromIso(criteria.window.from) : undefined,
            window_to: criteria?.window?.to ? fromIso(criteria.window.to) : undefined,
            family: editing.family ?? '',
            level: editing.level ?? null,
            is_active: editing.isActive,
          }
        : {
            code: '',
            title: '',
            description: '',
            category: 'kohort',
            reward_type: 'profile_border',
            badge_url: '',
            source: 'registration',
            threshold: null,
            window_from: undefined,
            window_to: undefined,
            family: '',
            level: null,
            is_active: true,
          },
    );
  }, [open, editing, form]);

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      const needsWindow = WINDOW_SOURCES.has(values.source);
      const hasWindow = needsWindow && values.window_from && values.window_to;
      await submit({
        code: values.code.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        reward_type: values.reward_type,
        badge_url: values.badge_url?.trim() || null,
        criteria: {
          source: values.source,
          threshold: values.source === 'manual' ? null : (values.threshold ?? null),
          window: hasWindow
            ? { from: toIsoWithOffset(values.window_from!), to: toIsoWithOffset(values.window_to!) }
            : null,
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
      <Form form={form} layout="vertical" onFinish={handleFinish}>
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
          name="badge_url"
          label="URL aset (opsional)"
          extra="Aset bingkai/badge/stiker di repo images (jsDelivr). Contoh: https://cdn.jsdelivr.net/gh/sambasku/images@main/assets/achievements/angkatan-ke-1.png"
        >
          <Input placeholder="https://cdn.jsdelivr.net/gh/sambasku/images@main/assets/achievements/..." />
        </Form.Item>

        <Typography.Title level={5}>Kriteria</Typography.Title>
        <Form.Item
          name="source"
          label="Sumber"
          extra="Sumber yang bisa dipilih terbatas. Source baru harus ditambah di registry backend dulu."
          rules={[{ required: true }]}
        >
          <Select options={SOURCE_OPTIONS} />
        </Form.Item>
        {source !== 'manual' ? (
          <Form.Item name="threshold" label="Ambang minimum (opsional)">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Kosong = tanpa ambang" />
          </Form.Item>
        ) : null}
        {WINDOW_SOURCES.has(source ?? '') ? (
          <Flex gap={8}>
            <Form.Item
              name="window_from"
              label="Mulai"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="window_to"
              label="Selesai"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: 'Wajib diisi' },
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
