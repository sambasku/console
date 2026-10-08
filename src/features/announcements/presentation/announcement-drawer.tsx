import { useEffect, useState } from 'react';
import {
  App as AntdApp,
  Button,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { normalizeError } from '@/shared/api/error';
import {
  ACTION_URL_ALLOWED_HOSTS,
  type Announcement,
  type AnnouncementBodyType,
} from '../domain/announcement';

interface FormValues {
  title: string;
  body: string;
  body_type?: AnnouncementBodyType;
  action_url?: string;
  action_label?: string;
  expires_at?: Dayjs | null;
}
/** Drawer buat/edit pengumuman (#102). Edit = semua field terisi prefilled. */
export function AnnouncementDrawer({
  open,
  onClose,
  onSaved,
  editing,
  submit,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Announcement | null;
  submit: (values: { title: string; body: string; body_type?: AnnouncementBodyType; action_url?: string | null; action_label?: string | null; expires_at?: number | null }) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const actionUrl = Form.useWatch('action_url', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      editing
        ? {
            title: editing.title,
            body: editing.body,
            body_type: editing.bodyType,
            action_url: editing.actionUrl ?? undefined,
            action_label: editing.actionLabel ?? undefined,
            expires_at: editing.expiresAt ? dayjs.unix(editing.expiresAt) : undefined,
          }
        : { title: '', body: '', body_type: 'plain', action_url: undefined, action_label: undefined, expires_at: undefined },
    );
  }, [open, editing, form]);

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      await submit({
        title: values.title.trim(),
        body: values.body.trim(),
        body_type: values.body_type ?? 'plain',
        action_url: values.action_url?.trim() || null,
        action_label: values.action_url?.trim() && values.action_label?.trim() ? values.action_label.trim() : null,
        expires_at: values.expires_at ? values.expires_at.unix() : null,
      });
      message.success(editing ? 'Pengumuman diperbarui' : 'Pengumuman tayang di feed');
      onSaved();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? 'Edit pengumuman' : 'Pengumuman baru'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Pengumuman langsung tayang di feed publik aplikasi setelah disimpan.
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label="Judul"
          rules={[
            { required: true, message: 'Wajib diisi' },
            { min: 3, max: 120, message: '3-120 karakter' },
          ]}
        >
          <Input placeholder="Mis. Kabar rilis v0.3" />
        </Form.Item>
        <Form.Item
          name="body_type"
          label="Format isi"
          initialValue="plain"
          extra="Plain: teks biasa. MD: markdown. HTML: dirender native aplikasi. Webview: isi dimuat via WebView (URL/HTML)."
        >
          <Select
            options={[
              { value: 'plain', label: 'Plain (teks)' },
              { value: 'md', label: 'MD (markdown)' },
              { value: 'html', label: 'HTML (render native)' },
              { value: 'webview', label: 'Webview (muat isi)' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="body"
          label="Isi"
          rules={[
            { required: true, message: 'Wajib diisi' },
            { min: 3, max: 5000, message: '3-5000 karakter' },
          ]}
        >
          <Input.TextArea rows={5} placeholder="Isi pengumuman" />
        </Form.Item>
        <Form.Item
          name="action_url"
          label="URL action (opsional)"
          extra={`https wajib. Host: ${ACTION_URL_ALLOWED_HOSTS.join(', ')}`}
          rules={[
            {
              validator: async (_, value: string | undefined) => {
                if (!value) return;
                const url = (() => {
                  try {
                    return new URL(value);
                  } catch {
                    return null;
                  }
                })();
                if (!url || url.protocol !== 'https:') {
                  throw new Error('URL https valid diperlukan');
                }
                const host = url.host.toLowerCase();
                if (!(ACTION_URL_ALLOWED_HOSTS as readonly string[]).includes(host)) {
                  throw new Error('Host tidak diizinkan');
                }
              },
            },
          ]}
        >
          <Input placeholder="https://sambasku.com/..." />
        </Form.Item>
        <Form.Item
          name="action_label"
          label="Label tombol (opsional)"
          rules={[{ min: 2, max: 40, message: '2-40 karakter' }]}
        >
          <Input placeholder="Mis. Baca selengkapnya" disabled={!actionUrl} />
        </Form.Item>
        <Form.Item name="expires_at" label="Berlaku sampai (opsional)" extra="Kosong = tayang tanpa batas.">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {editing ? 'Simpan' : 'Tayangkan'}
          </Button>
        </Flex>
      </Form>
    </Drawer>
  );
}
