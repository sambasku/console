import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Drawer,
  Flex,
  Form,
  Image,
  Input,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { DataTable } from "@/shared/components/data-table";
import { PageHeader } from "@/shared/components/page-header";
import { tableFeatureSet } from "@/shared/components/table-features";
import { normalizeError } from "@/shared/api/error";
import { useAuth } from "@/shared/auth/use-auth";
import { formatDateTime } from "@/shared/utils/format-datetime";
import type {
  CommunityCategory,
  CommunityFeaturedKind,
  CommunityOrg,
  CommunityProposal,
  CommunityProposalStatus,
} from "../domain/community";
import {
  COMMUNITY_CATEGORY_OPTIONS,
  COMMUNITY_FEATURED_OPTIONS,
  COMMUNITY_PROPOSAL_STATUS_LABEL,
  COMMUNITY_STATUS_LABEL,
  type CommunityOrgInput,
} from "../infrastructure/community-api";
import {
  useCommunityOrgs,
  useCommunityProposals,
  useReviewCommunityProposal,
  useSaveCommunityOrg,
  useSetCommunityOrgStatus,
} from "../application/use-community";
import { CommunityProposalDrawer } from "./community-proposal-drawer";

const proposalHelper = createColumnHelper<
  typeof tableFeatureSet,
  CommunityProposal
>();
const orgHelper = createColumnHelper<typeof tableFeatureSet, CommunityOrg>();

const CATEGORY_LABEL: Record<string, string> = {
  seni: "Seni",
  bahasa: "Bahasa",
  pendidikan: "Pendidikan",
  ukm: "UKM",
  lain: "Lainnya",
};

const FEATURED_LABEL: Record<CommunityFeaturedKind, string> = {
  tim: "Tim",
  sponsor: "Sponsor",
};

const STATUS_COLOR: Record<CommunityOrg["status"], string> = {
  published: "green",
  archived: "default",
};

const PROPOSAL_STATUS_COLOR: Record<CommunityProposalStatus, string> = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  cancelled: "default",
};

interface OrgFormValues {
  name: string;
  category: CommunityCategory;
  description: string;
  logo_url?: string | null;
  cover_url?: string | null;
  is_featured_kind?: CommunityFeaturedKind | null;
}

function CommunityOrgDrawer({
  open,
  editing,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: CommunityOrg | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    values: ({ id: string } & Partial<CommunityOrgInput>) | CommunityOrgInput,
  ) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<OrgFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        category: editing.category,
        description: editing.description,
        logo_url: editing.logoUrl,
        cover_url: editing.coverUrl,
        is_featured_kind: editing.isFeaturedKind,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ category: "lain", is_featured_kind: null });
    }
  }, [editing, form, open]);

  const submit = async (values: OrgFormValues) => {
    try {
      const body = {
        name: values.name,
        category_id: values.category,
        description: values.description,
        logo_url: values.logo_url || null,
        cover_url: values.cover_url || null,
        is_featured_kind: values.is_featured_kind ?? null,
      };
      await onSubmit(editing ? { id: editing.id, ...body } : body);
      message.success(editing ? "Organisasi diperbarui" : "Organisasi dibuat");
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Drawer
      title={editing ? "Edit organisasi" : "Organisasi baru"}
      open={open}
      onClose={onClose}
      width="min(720px, 100vw)"
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={onClose}>Batal</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Simpan
          </Button>
        </Flex>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={submit}
      >
        <Form.Item
          name="name"
          label="Nama organisasi"
          rules={[{ required: true, message: "Nama wajib diisi" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="category"
          label="Kategori"
          rules={[{ required: true, message: "Kategori wajib dipilih" }]}
        >
          <Select options={COMMUNITY_CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="description"
          label="Deskripsi"
          rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
        >
          <Input.TextArea rows={5} maxLength={320} showCount />
        </Form.Item>
        <Form.Item
          name="logo_url"
          label="URL logo"
          rules={[{ type: "url", message: "URL logo tidak valid" }]}
        >
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item
          name="cover_url"
          label="URL cover"
          rules={[{ type: "url", message: "URL cover tidak valid" }]}
        >
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item name="is_featured_kind" label="Sorotan">
          <Select
            allowClear
            placeholder="Bukan sorotan"
            options={COMMUNITY_FEATURED_OPTIONS}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export function CommunityPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === "admin" ||
    user?.role === "root" ||
    user?.role === "reviewer";
  const { message } = AntdApp.useApp();
  const [tab, setTab] = useState<"proposals" | "orgs">("proposals");
  const [proposalStatus, setProposalStatus] = useState<
    CommunityProposalStatus | undefined
  >("pending");
  const [selectedProposal, setSelectedProposal] =
    useState<CommunityProposal | null>(null);
  const [editingOrg, setEditingOrg] = useState<CommunityOrg | null>(null);
  const [orgDrawerOpen, setOrgDrawerOpen] = useState(false);

  const proposals = useCommunityProposals(
    { status: proposalStatus },
    canManage,
  );
  const orgs = useCommunityOrgs(canManage);
  const reviewProposal = useReviewCommunityProposal();
  const saveOrg = useSaveCommunityOrg();
  const setOrgStatus = useSetCommunityOrgStatus();

  const proposalColumns = useMemo(
    () =>
      proposalHelper.columns([
        proposalHelper.accessor("name", {
          header: "Nama",
          size: 240,
          cell: (info) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{info.getValue()}</Typography.Text>
              <Typography.Text type="secondary">
                {info.row.original.username ?? info.row.original.userId}
              </Typography.Text>
            </Space>
          ),
        }),
        proposalHelper.accessor("category", {
          header: "Kategori",
          size: 140,
          cell: (info) => <Tag>{CATEGORY_LABEL[info.getValue()]}</Tag>,
        }),
        proposalHelper.accessor("logoUrl", {
          header: "Logo",
          size: 100,
          cell: (info) =>
            info.getValue() ? (
              <Image
                src={info.getValue() ?? undefined}
                width={48}
                style={{ borderRadius: 8 }}
              />
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            ),
        }),
        proposalHelper.accessor("status", {
          header: "Status",
          size: 120,
          cell: (info) => {
            const status = info.getValue();
            return (
              <Tag color={PROPOSAL_STATUS_COLOR[status]}>
                {COMMUNITY_PROPOSAL_STATUS_LABEL[status]}
              </Tag>
            );
          },
        }),
        proposalHelper.accessor("createdAt", {
          header: "Dikirim",
          size: 170,
          cell: (info) => formatDateTime(info.getValue()),
        }),
        proposalHelper.display({
          id: "actions",
          header: "Aksi",
          size: 90,
          meta: { fixed: "right" },
          cell: (info) => (
            <Tooltip title="Tinjau">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => setSelectedProposal(info.row.original)}
              />
            </Tooltip>
          ),
        }),
      ]),
    [],
  );

  const orgColumns = useMemo(
    () =>
      orgHelper.columns([
        orgHelper.accessor("name", {
          header: "Nama",
          size: 240,
          cell: (info) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{info.getValue()}</Typography.Text>
              <Typography.Text type="secondary">
                {info.row.original.slug}
              </Typography.Text>
            </Space>
          ),
        }),
        orgHelper.accessor("category", {
          header: "Kategori",
          size: 140,
          cell: (info) => <Tag>{CATEGORY_LABEL[info.getValue()]}</Tag>,
        }),
        orgHelper.accessor("isFeaturedKind", {
          header: "Sorotan",
          size: 120,
          cell: (info) => {
            const value = info.getValue();
            return value ? (
              <Tag color="blue">{FEATURED_LABEL[value]}</Tag>
            ) : (
              "-"
            );
          },
        }),
        orgHelper.accessor("logoUrl", {
          header: "Logo",
          size: 100,
          cell: (info) =>
            info.getValue() ? (
              <Image
                src={info.getValue() ?? undefined}
                width={48}
                style={{ borderRadius: 8 }}
              />
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            ),
        }),
        orgHelper.accessor("status", {
          header: "Status",
          size: 120,
          cell: (info) => {
            const status = info.getValue();
            return (
              <Tag color={STATUS_COLOR[status]}>
                {COMMUNITY_STATUS_LABEL[status]}
              </Tag>
            );
          },
        }),
        orgHelper.accessor("updatedAt", {
          header: "Diperbarui",
          size: 170,
          cell: (info) =>
            formatDateTime(info.getValue() ?? info.row.original.createdAt),
        }),
        orgHelper.display({
          id: "actions",
          header: "Aksi",
          size: 130,
          meta: { fixed: "right" },
          cell: (info) => {
            const row = info.row.original;
            const nextStatus =
              row.status === "published" ? "archived" : "published";
            return (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingOrg(row);
                      setOrgDrawerOpen(true);
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title={
                    nextStatus === "archived"
                      ? "Arsipkan organisasi ini?"
                      : "Tayangkan lagi?"
                  }
                  description={
                    nextStatus === "archived"
                      ? "Organisasi hilang dari app publik sampai ditayangkan lagi."
                      : "Organisasi akan muncul lagi di app publik."
                  }
                  onConfirm={async () => {
                    try {
                      await setOrgStatus.mutateAsync({
                        id: row.id,
                        status: nextStatus,
                      });
                      message.success(
                        nextStatus === "archived"
                          ? "Organisasi diarsipkan"
                          : "Organisasi ditayangkan",
                      );
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button
                    type="link"
                    icon={
                      nextStatus === "archived" ? (
                        <StopOutlined />
                      ) : (
                        <UndoOutlined />
                      )
                    }
                  />
                </Popconfirm>
              </Space>
            );
          },
        }),
      ]),
    [message, setOrgStatus],
  );

  const proposalTable = useTable({
    features: tableFeatureSet,
    data: proposals.data ?? [],
    columns: proposalColumns,
    getRowId: (row) => row.id,
    manualPagination: true,
  });

  const orgTable = useTable({
    features: tableFeatureSet,
    data: orgs.data ?? [],
    columns: orgColumns,
    getRowId: (row) => row.id,
    manualPagination: true,
  });

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin, root, atau reviewer yang bisa mengelola komunitas.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Komunitas"
        subtitle="Kelola usulan dan organisasi komunitas Sambas."
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                void (tab === "proposals"
                  ? proposals.refetch()
                  : orgs.refetch())
              }
            >
              Muat ulang
            </Button>
            {tab === "orgs" ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingOrg(null);
                  setOrgDrawerOpen(true);
                }}
              >
                Organisasi baru
              </Button>
            ) : null}
          </Space>
        }
      />

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as "proposals" | "orgs")}
        items={[
          {
            key: "proposals",
            label: `Usulan (${proposals.data?.length ?? 0})`,
          },
          {
            key: "orgs",
            label: `Organisasi (${orgs.data?.length ?? 0})`,
          },
        ]}
      />

      {tab === "proposals" ? (
        <>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              allowClear
              placeholder="Semua status"
              value={proposalStatus}
              style={{ width: 180 }}
              onChange={(value) => setProposalStatus(value)}
              options={Object.entries(COMMUNITY_PROPOSAL_STATUS_LABEL).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
            />
          </Space>
          {proposals.isError ? (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message="Gagal memuat usulan komunitas"
              description={normalizeError(proposals.error).message}
            />
          ) : null}
          <DataTable
            table={proposalTable}
            rowKey={(record) => record.id}
            loading={proposals.isLoading || proposals.isFetching}
          />
        </>
      ) : (
        <>
          {orgs.isError ? (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message="Gagal memuat organisasi komunitas"
              description={normalizeError(orgs.error).message}
            />
          ) : null}
          <DataTable
            table={orgTable}
            rowKey={(record) => record.id}
            loading={orgs.isLoading || orgs.isFetching}
          />
        </>
      )}

      <Flex justify="center" style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">
          {tab === "proposals"
            ? `${proposals.data?.length ?? 0} usulan dimuat`
            : `${orgs.data?.length ?? 0} organisasi dimuat`}
        </Typography.Text>
      </Flex>

      <CommunityProposalDrawer
        proposal={selectedProposal}
        onClose={() => setSelectedProposal(null)}
        onReviewed={() => {
          void proposals.refetch();
          void orgs.refetch();
        }}
        review={(params) => reviewProposal.mutateAsync(params)}
      />

      <CommunityOrgDrawer
        open={orgDrawerOpen}
        editing={editingOrg}
        saving={saveOrg.isPending}
        onClose={() => setOrgDrawerOpen(false)}
        onSubmit={(values) => saveOrg.mutateAsync(values)}
      />
    </>
  );
}
