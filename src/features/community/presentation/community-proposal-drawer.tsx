import { useEffect, useState } from "react";
import {
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { normalizeError } from "@/shared/api/error";
import { formatDateTime } from "@/shared/utils/format-datetime";
import type { CommunityProposal } from "../domain/community";
import {
  COMMUNITY_CATEGORY_OPTIONS,
  COMMUNITY_FEATURED_OPTIONS,
  COMMUNITY_PROPOSAL_STATUS_LABEL,
  type CommunityProposalApproveInput,
} from "../infrastructure/community-api";

interface ApproveFormValues {
  name: string;
  category: CommunityProposalApproveInput["category"];
  description: string;
  logo_url?: string | null;
  is_featured_kind?: CommunityProposalApproveInput["is_featured_kind"];
}

export function CommunityProposalDrawer({
  proposal,
  onClose,
  onReviewed,
  review,
}: {
  proposal: CommunityProposal | null;
  onClose: () => void;
  onReviewed: () => void;
  review: (params: {
    id: string;
    action: "approve" | "reject";
    body?: CommunityProposalApproveInput | { note?: string | null };
  }) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<ApproveFormValues>();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (!proposal) return;
    form.setFieldsValue({
      name: proposal.name,
      category: proposal.category,
      description: proposal.description,
      logo_url: proposal.logoUrl,
      is_featured_kind: null,
    });
  }, [form, proposal]);

  const approve = async (values: ApproveFormValues) => {
    if (!proposal) return;
    setBusy("approve");
    try {
      await review({
        id: proposal.id,
        action: "approve",
        body: {
          name: values.name,
          category: values.category,
          description: values.description,
          logo_url: values.logo_url || null,
          is_featured_kind: values.is_featured_kind ?? null,
        },
      });
      message.success("Usulan komunitas disetujui");
      onReviewed();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!proposal) return;
    setBusy("reject");
    try {
      await review({
        id: proposal.id,
        action: "reject",
        body: { note: rejectNote.trim() || null },
      });
      message.success("Usulan komunitas ditolak");
      setRejectOpen(false);
      setRejectNote("");
      onReviewed();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Drawer
        title="Tinjau usulan komunitas"
        open={proposal != null}
        onClose={onClose}
        size="large"
        destroyOnHidden
        extra={
          <Space>
            <Button
              danger
              loading={busy === "reject"}
              disabled={busy != null}
              onClick={() => setRejectOpen(true)}
            >
              Tolak
            </Button>
            <Button
              type="primary"
              loading={busy === "approve"}
              disabled={busy != null}
              onClick={() => form.submit()}
            >
              Setujui
            </Button>
          </Space>
        }
      >
        {proposal ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <Tag color="blue">
                {COMMUNITY_PROPOSAL_STATUS_LABEL[proposal.status]}
              </Tag>
              <Tag>{proposal.category}</Tag>
            </Space>

            <Typography.Title level={4} style={{ margin: 0 }}>
              {proposal.name}
            </Typography.Title>

            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Pengusul">
                {proposal.username ?? proposal.userId}
              </Descriptions.Item>
              <Descriptions.Item label="Dikirim">
                {formatDateTime(proposal.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Catatan review">
                {proposal.reviewNote ?? "-"}
              </Descriptions.Item>
            </Descriptions>

            {proposal.logoUrl ? (
              <Image
                src={proposal.logoUrl}
                width={120}
                style={{ borderRadius: 12 }}
              />
            ) : null}

            <Form
              form={form}
              layout="vertical"
              requiredMark="optional"
              onFinish={approve}
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
              <Form.Item name="logo_url" label="URL logo">
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
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Tolak usulan komunitas?"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => void reject()}
        okText="Tolak"
        okButtonProps={{ danger: true, loading: busy === "reject" }}
        cancelText="Batal"
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          Catatan ini membantu pengusul tahu kenapa usulannya belum bisa tayang.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Contoh: deskripsi masih terlalu singkat"
        />
      </Modal>
    </>
  );
}
