import { useEffect, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { uploadImageToCdn } from '@/shared/api/image-upload';
import {
  useCreateAdminArticle,
  useUpdateAdminArticle,
} from '../application/use-encyclopedia-articles';
import { getArticleBySlugRequest } from '../infrastructure/encyclopedia-api';
import type { AdminArticleListItem, ArticleStatus } from '../domain/encyclopedia';

interface FormValues {
  title: string;
  slug?: string;
  category_id: string;
  tags_input?: string;
  excerpt?: string;
  body_md: string;
  references_md?: string;
  source_url?: string;
  cover_url?: string;
  status: ArticleStatus;
  change_note?: string;
}

export function ArticleDrawer({
  open,
  article,
  categoryOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  article: AdminArticleListItem | null;
  categoryOptions: { value: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const createMutation = useCreateAdminArticle();
  const updateMutation = useUpdateAdminArticle();

  useEffect(() => {
    if (!open) return;
    if (article) {
      // Ambil detail lengkap jika perlu (body_md)
      void getArticleBySlugRequest(article.slug).then((detail) => {
        form.setFieldsValue({
          title: detail.title,
          slug: detail.slug,
          category_id: detail.category.id,
          tags_input: detail.tags.join(', '),
          excerpt: detail.excerpt,
          body_md: detail.body_md,
          references_md: detail.references_md ?? undefined,
          source_url: detail.source_url ?? undefined,
          cover_url: detail.cover_url ?? undefined,
          status: detail.status,
          change_note: undefined,
        });
      }).catch(() => {
        // Fallback jika request gagal: isi field yang ada dari list item
        form.setFieldsValue({
          title: article.title,
          slug: article.slug,
          category_id: article.category.id,
          tags_input: article.tags.join(', '),
          excerpt: article.excerpt,
          body_md: '',
          cover_url: article.cover_url ?? undefined,
          status: article.status,
        });
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'draft',
        category_id: categoryOptions[0]?.value,
      });
    }
  }, [open, article, form, categoryOptions]);

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      const tags = (values.tags_input ?? '')
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
        .filter(Boolean);

      if (article) {
        await updateMutation.mutateAsync({
          id: article.id,
          title: values.title.trim(),
          category_id: values.category_id,
          tags,
          excerpt: values.excerpt?.trim() || '',
          body_md: values.body_md.trim(),
          references_md: values.references_md?.trim() || null,
          source_url: values.source_url?.trim() || null,
          cover_url: values.cover_url?.trim() || null,
          status: values.status,
          change_note: values.change_note?.trim() || null,
        });
        message.success('Artikel diperbarui');
      } else {
        await createMutation.mutateAsync({
          title: values.title.trim(),
          slug: values.slug?.trim() || undefined,
          category_id: values.category_id,
          tags,
          excerpt: values.excerpt?.trim() || '',
          body_md: values.body_md.trim(),
          references_md: values.references_md?.trim() || null,
          source_url: values.source_url?.trim() || null,
          cover_url: values.cover_url?.trim() || null,
          status: values.status === 'archived' ? 'draft' : values.status,
        });
        message.success('Artikel dibuat');
      }
      onSaved();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const uploaded = await uploadImageToCdn(file, '/encyclopedia');
      // Sisipkan markdown image ke body_md atau set cover_url jika belum ada
      const currentCover = form.getFieldValue('cover_url');
      if (!currentCover) {
        form.setFieldValue('cover_url', uploaded.url);
      }
      const currentBody = form.getFieldValue('body_md') ?? '';
      const imgMd = `\n![${file.name.replace(/\.[^/.]+$/, '')}](${uploaded.url})\n`;
      form.setFieldValue('body_md', currentBody + imgMd);
      message.success('Gambar diunggah dan disisipkan ke isi');
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setUploadingImage(false);
    }
    return false; // cegah antd default upload
  };

  return (
    <Drawer
      title={article ? 'Edit artikel' : 'Artikel baru'}
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label="Judul"
          rules={[
            { required: true, message: 'Wajib diisi' },
            { min: 3, max: 200, message: '3-200 karakter' },
          ]}
        >
          <Input placeholder="Mis. Kesultanan Sambas" />
        </Form.Item>

        {!article ? (
          <Form.Item
            name="slug"
            label="Slug (opsional)"
            extra="Huruf kecil, angka, dan hyphen. Kosongkan untuk generate otomatis dari judul."
          >
            <Input placeholder="mis. kesultanan-sambas" />
          </Form.Item>
        ) : null}

        <Flex gap={12}>
          <Form.Item
            name="category_id"
            label="Kategori"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Wajib dipilih' }]}
          >
            <Select options={categoryOptions} placeholder="Pilih kategori" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            style={{ width: 160 }}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'published', label: 'Tayang' },
                { value: 'draft', label: 'Draft' },
                ...(article ? [{ value: 'archived', label: 'Diarsipkan' }] : []),
              ]}
            />
          </Form.Item>
        </Flex>

        <Form.Item
          name="tags_input"
          label="Tag (pisahkan koma, maks 8)"
          extra="Contoh: sejarah, istana, kerajaan"
        >
          <Input placeholder="sejarah, istana, budaya" />
        </Form.Item>

        <Form.Item
          name="cover_url"
          label="URL foto sampul (opsional)"
          extra="URL HTTPS langsung dari ImageKit / CDN"
        >
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item
          name="excerpt"
          label="Ringkasan (maks 300 karakter)"
        >
          <Input.TextArea rows={2} maxLength={300} showCount placeholder="Deskripsi singkat artikel" />
        </Form.Item>

        <Form.Item
          name="body_md"
          label={
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Isi artikel (Markdown)</span>
              <Upload
                showUploadList={false}
                beforeUpload={handleUpload}
                accept="image/*"
              >
                <Button size="small" icon={<UploadOutlined />} loading={uploadingImage}>
                  Unggah gambar
                </Button>
              </Upload>
            </Space>
          }
          rules={[{ required: true, message: 'Isi artikel wajib diisi' }]}
        >
          <Input.TextArea
            rows={14}
            placeholder="Tulis artikel dengan format Markdown... Gunakan tombol Unggah Gambar di kanan atas untuk menyisipkan foto."
          />
        </Form.Item>

        <Form.Item
          name="references_md"
          label="Daftar referensi / rujukan (opsional)"
        >
          <Input.TextArea rows={3} placeholder="Format Markdown daftar rujukan atau buku acuan..." />
        </Form.Item>

        <Form.Item
          name="source_url"
          label="URL sumber rujukan utama (opsional)"
        >
          <Input placeholder="https://..." />
        </Form.Item>

        {article ? (
          <Form.Item
            name="change_note"
            label="Catatan perubahan (disimpan ke riwayat revisi)"
          >
            <Input placeholder="Mis. Melengkapi bagian sejarah abad ke-17" maxLength={300} />
          </Form.Item>
        ) : null}

        <Flex justify="end" gap={8} style={{ marginTop: 24 }}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {article ? 'Simpan perubahan' : 'Tayangkan artikel'}
          </Button>
        </Flex>
      </Form>
    </Drawer>
  );
}