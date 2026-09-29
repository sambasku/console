import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Collapse,
  Descriptions,
  Flex,
  Image,
  Input,
  Modal,
  Radio,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '@/shared/components/page-header';
import { PageLoading } from '@/shared/components/page-loading';
import { ImageCensorEditor } from '@/features/discussions/presentation/image-censor-editor';
import { useCategoryOptions, useWordClassOptions } from '@/features/words/application/use-reference-data';
import {
  useApproveWordSuggestion,
  useRejectWordSuggestion,
  useWordSuggestionDetail,
} from '../application/use-word-suggestion-actions';
import {
  describeSuggestionChanges,
  suggestionChangesAreEmpty,
  type ReplaceLine,
  type SuggestionChangeView,
} from '../domain/describe-suggestion-changes';
import {
  REASON_CODE_LABELS,
  SUGGESTION_STATUS_LABELS,
  type SuggestionDetail,
} from '../domain/word-suggestion';

type AddedImage = {
  url: string;
  is_primary: boolean;
  provider?: string | null;
  provider_file_id?: string | null;
};

function decisionKey(img: AddedImage, index: number): string {
  return img.provider_file_id?.trim() || String(index);
}

export function WordSuggestionDetailPage() {
  const { id } = useParams({ from: '/console-layout/word-suggestions/$id' });
  return <WordSuggestionDetail id={id} key={id} />;
}

function WordSuggestionDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { data, isLoading, isError, error } = useWordSuggestionDetail(id);
  const approve = useApproveWordSuggestion();
  const reject = useRejectWordSuggestion();
  const [comment, setComment] = useState('');
  const [imageDecisions, setImageDecisions] = useState<Record<string, 'approve' | 'reject'>>({});
  const [censoredByKey, setCensoredByKey] = useState<Record<string, Blob>>({});
  const [censorTarget, setCensorTarget] = useState<{ key: string; url: string } | null>(null);

  const categoryQuery = useCategoryOptions();
  const wordClassQuery = useWordClassOptions();
  const addedImages = useMemo(() => data?.diff.images?.added ?? [], [data]);
  const changes = useMemo(() => {
    if (!data) return null;
    const categoryById = new Map((categoryQuery.data ?? []).map((item) => [item.id, item.name]));
    const classById = new Map((wordClassQuery.data ?? []).map((item) => [item.id, item.name]));
    const categoriesReady = Boolean(categoryQuery.data) || categoryQuery.isError;
    const classesReady = Boolean(wordClassQuery.data) || wordClassQuery.isError;
    const lemmaByWordId = new Map<string, string>();
    for (const relation of data.current_word.relations) {
      if (relation.lemma) lemmaByWordId.set(relation.word_id, relation.lemma);
    }
    for (const relation of [
      ...(data.diff.relations?.added ?? []),
      ...(data.diff.relations?.removed ?? []),
    ]) {
      if (relation.lemma) lemmaByWordId.set(relation.word_id, relation.lemma);
    }
    return describeSuggestionChanges({
      proposed: data.suggestion.proposed_changes,
      current: data.current_word,
      categoryName: (id) => categoryById.get(id) ?? (categoriesReady ? 'Kategori tidak dikenal' : ''),
      wordClassName: (id) => classById.get(id) ?? (classesReady ? 'Kelas kata tidak dikenal' : ''),
      relationLemma: (wordId) => lemmaByWordId.get(wordId),
    });
  }, [
    categoryQuery.data,
    categoryQuery.isError,
    data,
    wordClassQuery.data,
    wordClassQuery.isError,
  ]);
  const pending = data?.suggestion.status === 'pending';

  if (isLoading) return <PageLoading tip="Memuat usulan…" />;
  if (isError || !data) {
    return (
      <Typography.Text type="danger">
        {error instanceof Error ? error.message : 'Usulan tidak ditemukan'}
      </Typography.Text>
    );
  }

  const { suggestion, current_word, diff } = data;
  const preview = changes;
  const hasImageDiff =
    (diff.images?.added.length ?? 0) +
      (diff.images?.removed.length ?? 0) +
      (diff.images?.set_primary.length ?? 0) >
    0;

  const onApprove = () => {
    modal.confirm({
      title: 'Setujui usulan?',
      content: 'Perubahan akan langsung diterapkan ke kata tayang.',
      onOk: async () => {
        const decisions =
          addedImages.length > 0
            ? addedImages.map((img, index) => {
                const key = decisionKey(img, index);
                return { key, decision: imageDecisions[key] ?? 'approve' };
              })
            : undefined;
        await approve.mutateAsync({
          id,
          comment: comment || undefined,
          imageDecisions: decisions,
          censoredByKey: Object.keys(censoredByKey).length > 0 ? censoredByKey : undefined,
        });
        message.success('Usulan disetujui');
        void navigate({ to: '/word-suggestions' });
      },
    });
  };

  const onReject = () => {
    if (!comment.trim()) {
      message.warning('Alasan penolakan wajib diisi');
      return;
    }
    modal.confirm({
      title: 'Tolak usulan?',
      onOk: async () => {
        await reject.mutateAsync({ id, comment: comment.trim() });
        message.success('Usulan ditolak');
        void navigate({ to: '/word-suggestions' });
      },
    });
  };

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title={`Usul: ${suggestion.word_lemma}`}
        subtitle={`Status: ${SUGGESTION_STATUS_LABELS[suggestion.status]}`}
        extra={
          <Button onClick={() => void navigate({ to: '/word-suggestions' })}>Kembali</Button>
        }
      />

      <Card title="Ringkasan">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Kontributor">
            {suggestion.contributor_display_name?.trim() ||
              suggestion.contributor_username ||
              suggestion.contributor_id}
          </Descriptions.Item>
          <Descriptions.Item label="Alasan">
            <Space>
              <Tag>{REASON_CODE_LABELS[suggestion.reason_code] ?? suggestion.reason_code}</Tag>
              <span>{suggestion.reason}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Diajukan">{suggestion.created_at}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Perubahan">
        {preview ? <SuggestionChangePreview view={preview} /> : null}
        {preview && suggestionChangesAreEmpty(preview) && !hasImageDiff ? (
          <Typography.Text type="secondary">Tidak ada perubahan yang bisa ditampilkan.</Typography.Text>
        ) : null}
        {diff.images ? (
          <>
            {diff.images.added.length > 0 && (
              <Image.PreviewGroup>
                <Space direction="vertical" size={8} style={{ marginTop: 12, marginBottom: 8 }}>
                  <Typography.Text strong>Gambar baru</Typography.Text>
                  {diff.images.added.map((img, i) => {
                    const key = decisionKey(img, i);
                    const decision = imageDecisions[key] ?? 'approve';
                    const canCensor =
                      pending && decision === 'approve' && img.provider === 'imagekit';
                    const hasCensor = Boolean(censoredByKey[key]);
                    return (
                      <Flex key={key} align="center" gap={8} wrap>
                        <Image
                          src={img.url}
                          width={72}
                          height={72}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                        <Space size={4} wrap>
                          {img.is_primary ? <Tag color="geekblue">Utama</Tag> : null}
                          {hasCensor ? <Tag color="orange">Tersensor</Tag> : null}
                        </Space>
                        {pending ? (
                          <Radio.Group
                            size="small"
                            optionType="button"
                            value={decision}
                            onChange={(e) => {
                              const next = e.target.value as 'approve' | 'reject';
                              setImageDecisions((prev) => ({ ...prev, [key]: next }));
                              if (next === 'reject') {
                                setCensoredByKey((prev) => {
                                  const copy = { ...prev };
                                  delete copy[key];
                                  return copy;
                                });
                              }
                            }}
                            options={[
                              { label: 'Tayangkan', value: 'approve' },
                              { label: 'Jangan tayangkan', value: 'reject' },
                            ]}
                          />
                        ) : null}
                        {canCensor ? (
                          <Space size={4}>
                            <Button
                              size="small"
                              onClick={() => setCensorTarget({ key, url: img.url })}
                            >
                              {hasCensor ? 'Edit sensor' : 'Sensor'}
                            </Button>
                            {hasCensor ? (
                              <Button
                                size="small"
                                type="link"
                                onClick={() =>
                                  setCensoredByKey((prev) => {
                                    const copy = { ...prev };
                                    delete copy[key];
                                    return copy;
                                  })
                                }
                              >
                                Batalkan sensor
                              </Button>
                            ) : null}
                          </Space>
                        ) : null}
                      </Flex>
                    );
                  })}
                </Space>
              </Image.PreviewGroup>
            )}
            {pending && diff.images.added.some((i) => i.provider === 'imagekit') ? (
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                Tayangkan menyimpan foto ke arsip publik. Jangan tayangkan menghapus foto ini.
                Sensor opsional sebelum tayang.
              </Typography.Text>
            ) : null}
            {diff.images.removed.length > 0 ? (
              <Space direction="vertical" size={8} style={{ marginTop: 12 }}>
                <Typography.Text strong>Gambar dihapus</Typography.Text>
                {diff.images.removed.map((item) => (
                  <ExistingImageRow
                    key={item.image_id}
                    image={current_word.images.find((row) => row.id === item.image_id)}
                    caption="Dihapus dari kata"
                    strike
                  />
                ))}
              </Space>
            ) : null}
            {diff.images.set_primary.length > 0 ? (
              <Space direction="vertical" size={8} style={{ marginTop: 12 }}>
                <Typography.Text strong>Gambar utama</Typography.Text>
                {diff.images.set_primary.map((item) => (
                  <ExistingImageRow
                    key={item.image_id}
                    image={current_word.images.find((row) => row.id === item.image_id)}
                    caption="Jadikan gambar utama"
                  />
                ))}
              </Space>
            ) : null}
          </>
        ) : null}
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          Kata yang tayang sekarang: {current_word.lemma}
        </Typography.Paragraph>
        <Collapse
          ghost
          items={[
            {
              key: 'raw',
              label: 'Data teknis',
              children: (
                <pre style={{ fontSize: 12, overflow: 'auto', maxHeight: 200, margin: 0 }}>
                  {JSON.stringify(suggestion.proposed_changes, null, 2)}
                </pre>
              ),
            },
          ]}
        />
      </Card>

      {pending && (
        <Card title="Keputusan">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input.TextArea
              rows={3}
              placeholder="Komentar (wajib untuk tolak)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Space>
              <Button type="primary" loading={approve.isPending} onClick={onApprove}>
                Setujui
              </Button>
              <Button danger loading={reject.isPending} onClick={onReject}>
                Tolak
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {censorTarget ? (
        <Modal
          title="Sensor foto"
          open
          onCancel={() => setCensorTarget(null)}
          footer={null}
          width={720}
          destroyOnHidden
          zIndex={1200}
        >
          <ImageCensorEditor
            imageUrl={censorTarget.url}
            confirmLabel="Simpan sensor"
            onCancel={() => setCensorTarget(null)}
            onApply={(blob) => {
              setCensoredByKey((prev) => ({ ...prev, [censorTarget.key]: blob }));
              setCensorTarget(null);
              message.success('Sensor disimpan. Akan dikirim saat Setujui.');
            }}
          />
        </Modal>
      ) : null}
    </Flex>
  );
}

function displayText(value: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'kosong';
}

function ReplaceLineView({ line }: { line: ReplaceLine }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {line.label}
      </Typography.Text>
      <div style={{ fontSize: 16, lineHeight: 1.5 }}>
        {line.before != null ? <Typography.Text delete>{displayText(line.before)}</Typography.Text> : null}
        {line.before != null && line.after != null ? (
          <Typography.Text type="secondary"> → </Typography.Text>
        ) : null}
        {line.after != null ? <Typography.Text strong>{displayText(line.after)}</Typography.Text> : null}
      </div>
    </div>
  );
}

function SuggestionChangePreview({ view }: { view: SuggestionChangeView }) {
  const relationLines = [...view.relations.added, ...view.relations.removed];
  const variantLines = [...view.variants.added, ...view.variants.removed];
  const hasCategories = view.categories.added.length > 0 || view.categories.removed.length > 0;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {view.texts.map((line) => (
        <ReplaceLineView key={line.label} line={line} />
      ))}
      {view.meanings.map((meaning, index) => (
        <div
          key={`${meaning.heading}-${index}`}
          style={{
            border: '1px solid var(--ant-color-border-secondary, rgba(0,0,0,0.06))',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Typography.Text strong>{meaning.heading}</Typography.Text>
          {meaning.lines.map((line) => (
            <ReplaceLineView key={line.label} line={line} />
          ))}
        </div>
      ))}
      {hasCategories ? (
        <div>
          <Typography.Text strong>Kategori</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Space size={4} wrap>
              {view.categories.added.map((name, index) => (
                <Tag key={`add-${index}`} color="green">
                  + {name}
                </Tag>
              ))}
              {view.categories.removed.map((name, index) => (
                <Tag key={`remove-${index}`} color="red">
                  - {name}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      ) : null}
      {relationLines.length > 0 ? (
        <div>
          <Typography.Text strong>Relasi</Typography.Text>
          {relationLines.map((line, index) => (
            <div key={`${line}-${index}`} style={{ marginTop: 4 }}>
              {line}
            </div>
          ))}
        </div>
      ) : null}
      {variantLines.length > 0 ? (
        <div>
          <Typography.Text strong>Varian</Typography.Text>
          {variantLines.map((line, index) => (
            <div key={`${line}-${index}`} style={{ marginTop: 4 }}>
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </Space>
  );
}

function ExistingImageRow({
  image,
  caption,
  strike,
}: {
  image: SuggestionDetail['current_word']['images'][number] | undefined;
  caption: string;
  strike?: boolean;
}) {
  if (!image) {
    return <Typography.Text type="secondary">Gambar tidak ditemukan pada kata saat ini.</Typography.Text>;
  }
  return (
    <Flex align="center" gap={8}>
      <Image src={image.url} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 6 }} />
      <div>
        <div>{strike ? <Typography.Text delete>{caption}</Typography.Text> : caption}</div>
        {image.alt_text?.trim() ? (
          <Typography.Text type="secondary">{image.alt_text}</Typography.Text>
        ) : null}
      </div>
    </Flex>
  );
}
