import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAllRegions } from '@/features/regions/application/use-regions';
import { useAdminLayanan, useLayananMutations, useLayananQueue } from '../application/use-layanan';
import type { LayananInput, LayananWire } from '../infrastructure/layanan-api';

const CATEGORY = [
  { value: 'ambulance', label: 'Ambulans' },
  { value: 'fire', label: 'Pemadam kebakaran' },
];

function phonesLabel(phones: { phone: string; note: string | null }[] | undefined): string {
  if (!phones?.length) return '-';
  return phones
    .map((p) => (p.note ? `${p.phone} (${p.note})` : p.phone))
    .join(', ');
}

export function LayananPage() {
  const { message } = AntdApp.useApp();
  const list = useAdminLayanan();
  const queue = useLayananQueue();
  const regions = useAllRegions();
  const actions = useLayananMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LayananWire | null>(null);
  const [form] = Form.useForm<LayananInput>();

  const kecamatan = (regions.data ?? []).filter(
    (r) => r.type === 'kecamatan' && r.status === 'published',
  );

  const save = async () => {
    const values = await form.validateFields();
    try {
      if (editing) await actions.update.mutateAsync({ id: editing.id, body: values });
      else await actions.create.mutateAsync(values);
      setOpen(false);
      message.success(editing ? 'Layanan diperbarui' : 'Layanan ditayangkan');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const start = (row?: LayananWire) => {
    setEditing(row ?? null);
    form.setFieldsValue(
      row
        ? {
            category: row.category,
            name: row.name,
            phones: row.phones.map((p) => ({
              phone: p.phone,
              note: p.note,
              whatsapp: p.whatsapp,
            })),
            logo_url: row.logo_url,
            address_text: row.address_text,
            region_id: row.region_id,
            note: row.note,
          }
        : {
            category: 'ambulance',
            phones: [{ phone: '', note: null, whatsapp: null }],
          },
    );
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Layanan Publik"
        extra={<Button type="primary" onClick={() => start()}>Tambah</Button>}
      />
      <Typography.Title level={5}>Antrean usulan</Typography.Title>
      <Table
        rowKey="id"
        size="small"
        loading={queue.isLoading}
        dataSource={queue.data ?? []}
        pagination={false}
        columns={[
          { title: 'Jenis', dataIndex: 'kind', width: 80 },
          { title: 'Pengusul', dataIndex: 'username' },
          { title: 'Nama', render: (_, row) => row.payload.name },
          { title: 'Telepon', render: (_, row) => phonesLabel(row.payload.phones) },
          {
            title: '',
            render: (_, row) => (
              <Space>
                <Button size="small" type="primary" onClick={() => actions.approve.mutate(row.id)}>
                  Setujui
                </Button>
                <Button size="small" onClick={() => {
                  const note = window.prompt('Catatan revisi');
                  if (note && note.trim().length >= 3) {
                    actions.revise.mutate({ id: row.id, note: note.trim() });
                  }
                }}>
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
      <Typography.Title level={5} style={{ marginTop: 24 }}>Yang tercatat</Typography.Title>
      <Table
        rowKey="id"
        size="small"
        loading={list.isLoading}
        dataSource={list.data ?? []}
        columns={[
          {
            title: 'Kategori',
            dataIndex: 'category',
            render: (v: string) => (v === 'fire' ? 'Pemadam' : 'Ambulans'),
          },
          { title: 'Nama', dataIndex: 'name' },
          { title: 'Kecamatan', dataIndex: 'region_name' },
          { title: 'Telepon', render: (_, row) => phonesLabel(row.phones) },
          {
            title: 'Status',
            dataIndex: 'publish_status',
            render: (v: string) => (
              <Tag color={v === 'published' ? 'green' : 'default'}>
                {v === 'published' ? 'Tayang' : 'Turun'}
              </Tag>
            ),
          },
          {
            title: '',
            render: (_, row) => (
              <Space>
                <Button size="small" onClick={() => start(row)}>Ubah</Button>
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
        title={editing ? 'Ubah layanan' : 'Layanan baru'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        confirmLoading={actions.create.isPending || actions.update.isPending}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="Kategori" rules={[{ required: true }]}>
            <Select options={CATEGORY} />
          </Form.Item>
          <Form.Item name="region_id" label="Kecamatan" rules={[{ required: true, message: 'Kecamatan wajib dipilih' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={kecamatan.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item name="name" label="Nama" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logo_url" label="Tautan logo">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.List
            name="phones"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || value.length < 1) {
                    throw new Error('Minimal satu nomor');
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }} wrap>
                    <Form.Item
                      {...field}
                      name={[field.name, 'phone']}
                      label="Telepon"
                      rules={[{ required: true, min: 8 }]}
                    >
                      <Input style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'note']} label="Keterangan">
                      <Input placeholder="Shift malam" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'whatsapp']} label="WhatsApp">
                      <Input style={{ width: 140 }} />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        Hapus
                      </Button>
                    ) : null}
                  </Space>
                ))}
                {fields.length < 5 ? (
                  <Button type="dashed" onClick={() => add({ phone: '', note: null, whatsapp: null })} block>
                    Tambah nomor
                  </Button>
                ) : null}
              </>
            )}
          </Form.List>
          <Form.Item name="address_text" label="Alamat">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Catatan organisasi">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
