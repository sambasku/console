import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAdminKarya, useKaryaMutations, useKaryaQueue } from '../application/use-karya';
import type { KaryaInput, KaryaWire } from '../infrastructure/karya-api';

const KIND_OPTIONS = [
  { value: 'music', label: 'Musik' },
  { value: 'film', label: 'Film' },
];

const RELATED_KIND_OPTIONS = [
  { value: 'place', label: 'Tempat' },
  { value: 'event', label: 'Acara' },
  { value: 'article', label: 'Artikel' },
  { value: 'usaha', label: 'Usaha' },
  { value: 'kreator', label: 'Kreator' },
  { value: 'karya', label: 'Karya' },
  { value: 'word', label: 'Kata' },
];

const SAMBAS_TYPES = [
  { value: 'creator_origin', label: 'Kreator dari Sambas' },
  { value: 'language', label: 'Bahasa Sambas' },
  { value: 'location', label: 'Lokasi Sambas' },
  { value: 'theme', label: 'Tema Sambas' },
  { value: 'other', label: 'Lainnya' },
];

function creditsLabel(credits: { role: string; name_text: string }[] | undefined): string {
  if (!credits?.length) return '-';
  return credits.map((c) => `${c.name_text} (${c.role})`).join(', ');
}

function payloadTitle(payload: Record<string, unknown>): string {
  if (typeof payload.title === 'string') return payload.title;
  if (typeof payload.text === 'string') {
    const t = payload.text.trim();
    return t.length > 40 ? `${t.slice(0, 40)}…` : t;
  }
  return '-';
}

export function KaryaPage() {
  const { message } = AntdApp.useApp();
  const list = useAdminKarya();
  const queue = useKaryaQueue();
  const actions = useKaryaMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KaryaWire | null>(null);
  const [form] = Form.useForm<KaryaInput>();
  const kind = Form.useWatch('kind', form);

  const save = async () => {
    const values = await form.validateFields();
    try {
      if (editing) await actions.update.mutateAsync({ id: editing.id, body: values });
      else await actions.create.mutateAsync(values);
      setOpen(false);
      message.success(editing ? 'Karya diperbarui' : 'Karya ditayangkan');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const start = (row?: KaryaWire) => {
    setEditing(row ?? null);
    form.setFieldsValue(
      row
        ? {
            title: row.title,
            year: row.year,
            kind: row.kind,
            language: row.language,
            description: row.description,
            cover_url: row.cover_url,
            sambas_connections: row.sambas_connections,
            access_links: row.access_links,
            credits: row.credits,
            music_release_type: row.music_release_type,
            music_is_cover: row.music_is_cover,
            film_type: row.film_type,
            film_runtime_min: row.film_runtime_min,
            related: row.related_refs ?? [],
          }
        : {
            kind: 'music',
            year: null,
            sambas_connections: [],
            credits: [{ role: 'vocal', name_text: '' }],
            access_links: [],
            related: [],
          },
    );
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Karya"
        extra={
          <Button type="primary" onClick={() => start()}>
            Tambah
          </Button>
        }
      />
      <Typography.Title level={5}>Antrean usulan</Typography.Title>
      <Table
        rowKey="id"
        size="small"
        loading={queue.isLoading}
        dataSource={queue.data ?? []}
        pagination={false}
        columns={[
          { title: 'Jenis', dataIndex: 'kind', width: 90 },
          { title: 'Pengusul', dataIndex: 'username' },
          { title: 'Isi', render: (_, row) => payloadTitle(row.payload) },
          {
            title: '',
            render: (_, row) => (
              <Space>
                <Button size="small" type="primary" onClick={() => actions.approve.mutate(row.id)}>
                  Setujui
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const note = window.prompt('Catatan revisi');
                    if (note && note.trim().length >= 3) {
                      actions.revise.mutate({ id: row.id, note: note.trim() });
                    }
                  }}
                >
                  Revisi
                </Button>
                <Button size="small" danger onClick={() => actions.reject.mutate(row.id)}>
                  Tolak
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Yang tercatat
      </Typography.Title>
      <Table
        rowKey="id"
        size="small"
        loading={list.isLoading}
        dataSource={list.data ?? []}
        columns={[
          {
            title: 'Jenis',
            dataIndex: 'kind',
            render: (v: string) => (v === 'film' ? 'Film' : 'Musik'),
            width: 80,
          },
          { title: 'Judul', dataIndex: 'title' },
          { title: 'Tahun', dataIndex: 'year', width: 80 },
          { title: 'Credit', render: (_, row) => creditsLabel(row.credits) },
          {
            title: 'Pengusul',
            dataIndex: 'author_username',
            render: (v: string | null | undefined) => v ?? '-',
          },
          {
            title: 'Status',
            dataIndex: 'publish_status',
            render: (v: string) => (
              <Tag color={v === 'published' ? 'green' : 'default'}>
                {v === 'published' ? 'Tayang' : v}
              </Tag>
            ),
          },
          {
            title: '',
            render: (_, row) => (
              <Space>
                <Button size="small" onClick={() => start(row)}>
                  Ubah
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    actions.publish.mutate({
                      id: row.id,
                      published: row.publish_status !== 'published',
                    })
                  }
                >
                  {row.publish_status === 'published' ? 'Turunkan' : 'Tayangkan'}
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Ubah karya' : 'Karya baru'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        confirmLoading={actions.create.isPending || actions.update.isPending}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="kind" label="Jenis" rules={[{ required: true }]}>
            <Select
              options={KIND_OPTIONS}
              onChange={(v) => {
                form.setFieldValue(
                  'credits',
                  v === 'film'
                    ? [{ role: 'director', name_text: '' }]
                    : [{ role: 'vocal', name_text: '' }],
                );
              }}
            />
          </Form.Item>
          <Form.Item name="title" label="Judul" rules={[{ required: true, min: 1 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="year" label="Tahun">
            <InputNumber min={1800} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="language" label="Bahasa">
            <Input placeholder="sbs / id" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="cover_url" label="Cover / poster">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.List name="sambas_connections">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap style={{ display: 'flex' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'type']}
                      label="Kaitan Sambas"
                      rules={[{ required: true }]}
                    >
                      <Select options={SAMBAS_TYPES} style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'note']}
                      label="Catatan"
                      rules={[{ required: true, min: 1 }]}
                    >
                      <Input style={{ width: 280 }} />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        Hapus
                      </Button>
                    ) : null}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ type: 'other', note: '' })} block>
                  Tambah kaitan Sambas
                </Button>
              </>
            )}
          </Form.List>
          <Form.List name="related">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap style={{ display: 'flex' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'kind']}
                      label="Terkait"
                      rules={[{ required: true }]}
                    >
                      <Select options={RELATED_KIND_OPTIONS} style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'slug']} label="Slug">
                      <Input style={{ width: 200 }} placeholder="slug publik" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'id']} label="ID">
                      <Input style={{ width: 220 }} placeholder="ULID (opsional)" />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(field.name)}>
                      Hapus
                    </Button>
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ kind: 'place', slug: '' })}
                  block
                >
                  Tambah terkait
                </Button>
              </>
            )}
          </Form.List>
          <Form.List
            name="credits"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || value.length < 1) throw new Error('Minimal satu credit');
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap style={{ display: 'flex' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'role']}
                      label="Role"
                      rules={[{ required: true }]}
                    >
                      <Input style={{ width: 140 }} placeholder={kind === 'film' ? 'director' : 'vocal'} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'name_text']}
                      label="Nama"
                      rules={[{ required: true }]}
                    >
                      <Input style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'kreator_id']} label="Kreator ID">
                      <Input style={{ width: 200 }} disabled placeholder="Auto-link saat simpan" />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        Hapus
                      </Button>
                    ) : null}
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      role: kind === 'film' ? 'cast' : 'feat',
                      name_text: '',
                    })
                  }
                  block
                >
                  Tambah credit
                </Button>
              </>
            )}
          </Form.List>
          <Form.List name="access_links">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap style={{ display: 'flex' }}>
                    <Form.Item {...field} name={[field.name, 'kind']} label="Akses" rules={[{ required: true }]}>
                      <Select
                        style={{ width: 120 }}
                        options={[
                          { value: 'listen', label: 'Dengar' },
                          { value: 'watch', label: 'Tonton' },
                          ...(kind === 'film'
                            ? [{ value: 'trailer' as const, label: 'Trailer' }]
                            : []),
                          { value: 'buy', label: 'Beli' },
                          { value: 'official', label: 'Resmi' },
                          { value: 'other', label: 'Lainnya' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'label']} label="Label" rules={[{ required: true }]}>
                      <Input style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'url']} label="URL" rules={[{ required: true, type: 'url' }]}>
                      <Input style={{ width: 260 }} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(field.name)}>
                      Hapus
                    </Button>
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      kind: kind === 'film' ? 'watch' : 'listen',
                      label: '',
                      url: '',
                    })
                  }
                  block
                >
                  Tambah link akses
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}
