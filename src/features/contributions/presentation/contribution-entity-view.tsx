import { useMemo, type ReactNode } from 'react';
import { Button, Flex, Image, Radio, Space, Tag, Typography } from 'antd';
import { pickDefaultLanguageIds } from '@/features/words/application/create-word-utils';
import { useDialectOptions, useLanguageOptions, useWordClassOptions } from '@/features/words/application/use-reference-data';
import {
  EXAMPLE_SOURCE_LABELS,
  RELATION_TYPE_LABELS,
  TRANSLATION_TYPE_LABELS,
  VARIANT_TYPE_LABELS,
} from '@/features/words/domain/create-word';
import { WORD_STATUS_LABELS, WORD_TYPE_LABELS, USAGE_LABEL_LABELS, type UsageLabel } from '@/features/words/domain/word';
import { SafeAudioPlayer } from '@/shared/components/safe-audio-player';
import type {
  ContributionDetailView,
  ExampleChildData,
  MeaningChildData,
  PronunciationChildData,
  WordEntityView,
  WordAudioChildData,
  WordImageChildData,
  WordImageView,
} from '../domain/contribution';

const { Text } = Typography;

const ENTITY_STATUS_TAG_COLOR: Record<string, string> = {
  published: 'green',
  pending_review: 'orange',
  draft: 'default',
  rejected: 'red',
  taken_down: 'magenta',
};

function StatusTag({ status }: { status: string }) {
  const label = WORD_STATUS_LABELS[status as keyof typeof WORD_STATUS_LABELS] ?? status;
  const color = ENTITY_STATUS_TAG_COLOR[status] ?? 'default';
  return <Tag color={color}>{label}</Tag>;
}

function VerifiedTag({ isVerified, isCorrected }: { isVerified: boolean; isCorrected: boolean }) {
  return (
    <>
      {isVerified ? <Tag color="cyan">Terverifikasi</Tag> : null}
      {isCorrected ? <Tag color="blue">Sudah dikoreksi</Tag> : null}
    </>
  );
}

const PAIR_GRID_CSS = `
.review-pair-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
}
@media (max-width: 640px) {
  .review-pair-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }
}
`;

function ReadPane({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: 0,
        height: '100%',
        overflow: 'auto',
        border: '1px solid var(--ant-color-border-secondary, rgba(0,0,0,0.06))',
        borderRadius: 8,
        padding: 12,
        background: 'var(--ant-color-fill-quaternary, rgba(0,0,0,0.02))',
      }}
    >
      <Text type="secondary" strong style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
        {title}
      </Text>
      {children}
    </div>
  );
}

function PairGrid({
  leftTitle,
  left,
  rightTitle,
  right,
}: {
  leftTitle: string;
  left: ReactNode;
  rightTitle: string;
  right: ReactNode;
}) {
  return (
    <div style={{ height: '100%', minHeight: 0 }}>
      <style>{PAIR_GRID_CSS}</style>
      <div className="review-pair-grid">
        <ReadPane title={leftTitle}>{left}</ReadPane>
        <ReadPane title={rightTitle}>{right}</ReadPane>
      </div>
    </div>
  );
}

type DialectLabel = (dialectId: string | null | undefined) => string;

/**
 * Nama dialek dari data referensi. Respons review hanya membawa ULID;
 * daftar dialek di-scope ke bahasa kata, atau bahasa Sambas bila entity
 * anak tidak menyertakan language id (semua dialek seed milik SBS).
 */
function useDialectLabel(languageId: string | null | undefined): DialectLabel {
  const languageQuery = useLanguageOptions();
  const fallbackLanguageId = useMemo(
    () => pickDefaultLanguageIds(languageQuery.data ?? []).sourceId,
    [languageQuery.data],
  );
  const dialectQuery = useDialectOptions(languageId ?? fallbackLanguageId);

  return useMemo(() => {
    const byId = new Map((dialectQuery.data ?? []).map((d) => [d.id, d.name]));
    const settled = Boolean(dialectQuery.data) || dialectQuery.isError;
    return (dialectId) => {
      if (!dialectId) return 'Umum / tidak ada';
      const name = byId.get(dialectId);
      if (name) return name;
      return settled ? 'Dialek tidak dikenal' : '…';
    };
  }, [dialectQuery.data, dialectQuery.isError]);
}

/**
 * Nama bahasa dari data referensi (untuk label terjemahan makna).
 * Pola sama dengan useDialectLabel - respons review hanya membawa ID.
 */
function useLanguageLabel(): (languageId: string | null | undefined) => string {
  const languageQuery = useLanguageOptions();
  return useMemo(() => {
    const byId = new Map((languageQuery.data ?? []).map((l) => [l.id, l.name]));
    const settled = Boolean(languageQuery.data) || languageQuery.isError;
    return (languageId) => {
      if (!languageId) return 'Bahasa tidak diketahui';
      const name = byId.get(languageId);
      if (name) return name;
      return settled ? 'Bahasa tidak dikenal' : '…';
    };
  }, [languageQuery.data, languageQuery.isError]);
}

/** Nama kelas kata dari data referensi. */
function useWordClassLabel(): (wordClassId: string | null | undefined) => string | null {
  const wordClassQuery = useWordClassOptions();
  return useMemo(() => {
    const byId = new Map((wordClassQuery.data ?? []).map((c) => [c.id, c.alias || c.name]));
    const settled = Boolean(wordClassQuery.data) || wordClassQuery.isError;
    return (wordClassId) => {
      if (!wordClassId) return null;
      const name = byId.get(wordClassId);
      if (name) return name;
      return settled ? null : '…';
    };
  }, [wordClassQuery.data, wordClassQuery.isError]);
}

/**
 * Tampilan READ-ONLY isi kontribusi - dipakai di dalam drawer review.
 * Word → seluruh detail kata (semua status); anak → row entity + parent.
 */
export function ContributionEntityView({
  detail,
  imageDecisions,
  onImageDecision,
  censoredByImageId,
  onRequestCensor,
  onClearCensor,
}: {
  detail: ContributionDetailView;
  /** Hanya usulan kata yang masih pending. */
  imageDecisions?: Record<string, 'approve' | 'reject'>;
  onImageDecision?: (imageId: string, decision: 'approve' | 'reject') => void;
  censoredByImageId?: Record<string, Blob>;
  onRequestCensor?: (image: WordImageView) => void;
  onClearCensor?: (imageId: string) => void;
}) {
  const dialectLabel = useDialectLabel(detail.entityType === 'word' ? detail.word.languageId : null);

  if (detail.entityType === 'word') {
    return (
      <WordEntityDetail
        word={detail.word}
        dialectLabel={dialectLabel}
        imageDecisions={imageDecisions}
        onImageDecision={onImageDecision}
        censoredByImageId={censoredByImageId}
        onRequestCensor={onRequestCensor}
        onClearCensor={onClearCensor}
      />
    );
  }

  const child = detail.child;
  let content: ReactNode;
  if (detail.entityType === 'pronunciation') {
    content = (
      <PronunciationDetail fields={child.fields as PronunciationChildData} dialectLabel={dialectLabel} />
    );
  } else if (detail.entityType === 'word_image') {
    const fields = child.fields as WordImageChildData;
    const asView: WordImageView = {
      id: child.id,
      url: fields.url,
      altText: fields.alt_text,
      isPrimary: fields.is_primary,
      provider: fields.provider,
      isVerified: child.isVerified,
    };
    content = (
      <WordImageDetail
        fields={fields}
        image={asView}
        hasCensor={Boolean(censoredByImageId?.[child.id])}
        onRequestCensor={onRequestCensor}
        onClearCensor={onClearCensor}
      />
    );
  } else if (detail.entityType === 'word_audio') {
    content = (
      <WordAudioDetail
        fields={child.fields as WordAudioChildData}
        dialectLabel={dialectLabel}
      />
    );
  } else if (detail.entityType === 'meaning') {
    content = <MeaningDetail fields={child.fields as MeaningChildData} />;
  } else {
    content = <ExampleDetail fields={child.fields as ExampleChildData} />;
  }

  return (
    <Flex vertical gap={8} style={{ flex: 1, height: '100%', minHeight: 0 }}>
      <Flex align="center" gap={8} style={{ flex: 'none' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Kata induk: {child.wordLemma ?? '-'}
        </Text>
        <StatusTag status={child.status} />
      </Flex>
      <div style={{ flex: 1, minHeight: 0 }}>{content}</div>
    </Flex>
  );
}

function WordEntityDetail({
  word,
  dialectLabel,
  imageDecisions,
  onImageDecision,
  censoredByImageId,
  onRequestCensor,
  onClearCensor,
}: {
  word: WordEntityView;
  dialectLabel: DialectLabel;
  imageDecisions?: Record<string, 'approve' | 'reject'>;
  onImageDecision?: (imageId: string, decision: 'approve' | 'reject') => void;
  censoredByImageId?: Record<string, Blob>;
  onRequestCensor?: (image: WordImageView) => void;
  onClearCensor?: (imageId: string) => void;
}) {
  return (
    <Flex vertical gap={16} style={{ height: '100%', minHeight: 0, overflow: 'auto' }}>
      <Flex wrap gap={6} align="center">
        <Text type="secondary">{WORD_TYPE_LABELS[word.wordType] ?? word.wordType}</Text>
        {word.dialectId ? <Tag>{dialectLabel(word.dialectId)}</Tag> : null}
        <StatusTag status={word.status} />
        <VerifiedTag isVerified={word.isVerified} isCorrected={word.isCorrected} />
        {word.usageLabels.map((code) => (
          <Tag
            key={code}
            color={
              code === 'kasar' || code === 'tabu' || code === 'seksual' || code === 'diskriminatif'
                ? 'volcano'
                : 'default'
            }
          >
            {USAGE_LABEL_LABELS[code as UsageLabel] ?? code}
          </Tag>
        ))}
      </Flex>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Makna
        </Text>
        {word.meanings.length === 0 ? (
          <Text type="secondary">Tidak ada makna.</Text>
        ) : (
          <Flex vertical gap={16}>
            {word.meanings.map((meaning, index) => (
              <div key={meaning.id || `${meaning.wordClassId}-${meaning.definition}`}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {meaning.wordClassName || `Makna ${index + 1}`}
                </Text>
                <div style={{ fontSize: 16, lineHeight: 1.5, marginTop: 4 }}>{meaning.definition}</div>
                {meaning.translations.length === 0 ? (
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    Belum ada terjemahan.
                  </Text>
                ) : (
                  meaning.translations.map((translation, translationIndex) => (
                    <div key={translationIndex} style={{ marginTop: 4 }}>
                      <Text type="secondary">
                        {translation.text}
                        {translation.type
                          ? ` (${TRANSLATION_TYPE_LABELS[translation.type as keyof typeof TRANSLATION_TYPE_LABELS] ?? translation.type})`
                          : ''}
                      </Text>
                    </div>
                  ))
                )}
                {meaning.examples.map((example, exampleIndex) => (
                  <div key={exampleIndex} style={{ marginTop: 8 }}>
                    <Text italic>“{example.source}”</Text>
                    {example.target ? <Text type="secondary"> - {example.target}</Text> : null}
                    {example.sourceType ? (
                      <Text type="secondary">
                        {' '}
                        ({EXAMPLE_SOURCE_LABELS[example.sourceType as keyof typeof EXAMPLE_SOURCE_LABELS] ?? example.sourceType})
                      </Text>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </Flex>
        )}
      </div>

      {word.notes ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Catatan
          </Text>
          <div style={{ lineHeight: 1.5 }}>{word.notes}</div>
        </div>
      ) : null}

      {word.categories.length ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Kategori
          </Text>
          <Flex gap={4} wrap>
            {word.categories.map((category) => (
              <Tag key={category.id}>{category.name}</Tag>
            ))}
          </Flex>
        </div>
      ) : null}

      {word.pronunciations.length ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Pengucapan
          </Text>
          {word.pronunciations.map((pronunciation) => (
            <div key={pronunciation.id}>
              <Text code>{pronunciation.value}</Text>
              {pronunciation.dialectId ? (
                <Text type="secondary"> · {dialectLabel(pronunciation.dialectId)}</Text>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {word.variants.length ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Varian
          </Text>
          {word.variants.map((variant) => {
            const kind =
              VARIANT_TYPE_LABELS[variant.variantType as keyof typeof VARIANT_TYPE_LABELS] ??
              variant.variantType;
            const affix = [variant.affixType ? `afiks ${variant.affixType}` : null, variant.affixValue]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={variant.id}>
                {variant.form}{' '}
                <Text type="secondary">({affix ? `${kind}, ${affix}` : kind})</Text>
              </div>
            );
          })}
        </div>
      ) : null}

      {word.relatedWords.length ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Relasi
          </Text>
          {word.relatedWords.map((relation) => (
            <div key={`${relation.relationType}-${relation.wordId}`}>
              {relation.lemma}{' '}
              <Text type="secondary">
                (
                {RELATION_TYPE_LABELS[relation.relationType as keyof typeof RELATION_TYPE_LABELS] ??
                  relation.relationType}
                )
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      {word.appearsIn.length ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Muncul dalam
          </Text>
          {word.appearsIn.map((relation) => (
            <div key={`${relation.relationType}-${relation.wordId}`}>
              {relation.lemma}{' '}
              <Text type="secondary">
                (
                {RELATION_TYPE_LABELS[relation.relationType as keyof typeof RELATION_TYPE_LABELS] ??
                  relation.relationType}
                )
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      {word.images.length ? (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Gambar
          </Text>
          <Image.PreviewGroup>
            <Flex gap={12} style={{ overflowX: 'auto' }}>
              {word.images.map((img) => {
                const decision = imageDecisions?.[img.id] ?? 'approve';
                const canCensor = decision === 'approve' && img.provider === 'imagekit' && !!onRequestCensor;
                const hasCensor = Boolean(censoredByImageId?.[img.id]);
                return (
                  <Flex key={img.id} vertical gap={4} style={{ flex: 'none' }}>
                    <Image
                      src={img.url}
                      alt={img.altText?.trim() || 'Gambar usulan'}
                      height={64}
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                    />
                    <Space size={4} wrap>
                      {img.isPrimary ? <Tag color="geekblue">Utama</Tag> : null}
                      {img.status ? <StatusTag status={img.status} /> : null}
                      {hasCensor ? <Tag color="orange">Tersensor</Tag> : null}
                    </Space>
                    {img.altText?.trim() ? (
                      <Text type="secondary" style={{ fontSize: 12, maxWidth: 160 }}>
                        {img.altText}
                      </Text>
                    ) : null}
                    {onImageDecision ? (
                      <Radio.Group
                        size="small"
                        optionType="button"
                        value={decision}
                        onChange={(event) => onImageDecision(img.id, event.target.value)}
                        options={[
                          { label: 'Tayangkan', value: 'approve' },
                          { label: 'Jangan tayangkan', value: 'reject' },
                        ]}
                      />
                    ) : null}
                    {canCensor ? (
                      <Space size={4}>
                        <Button size="small" onClick={() => onRequestCensor(img)}>
                          {hasCensor ? 'Edit sensor' : 'Sensor'}
                        </Button>
                        {hasCensor && onClearCensor ? (
                          <Button size="small" type="link" onClick={() => onClearCensor(img.id)}>
                            Batal
                          </Button>
                        ) : null}
                      </Space>
                    ) : null}
                  </Flex>
                );
              })}
            </Flex>
          </Image.PreviewGroup>
        </div>
      ) : null}
    </Flex>
  );
}

function PronunciationDetail({
  fields,
  dialectLabel,
}: {
  fields: PronunciationChildData;
  dialectLabel: DialectLabel;
}) {
  const caption = [
    fields.notation ? `Notasi ${fields.notation}` : null,
    `Dialek ${dialectLabel(fields.dialect_id)}`,
    fields.speaker_name ? `Penutur ${fields.speaker_name}` : null,
    fields.notes ? `Catatan: ${fields.notes}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Flex vertical gap={8} style={{ height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReadPane title="Pengucapan">
          <Text code style={{ fontSize: 20 }}>
            {fields.value}
          </Text>
        </ReadPane>
      </div>
      {fields.audio_url ? <SafeAudioPlayer url={fields.audio_url} maxWidth={360} /> : null}
      {caption ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {caption}
        </Text>
      ) : null}
    </Flex>
  );
}

function WordAudioDetail({
  fields,
  dialectLabel,
}: {
  fields: WordAudioChildData;
  dialectLabel: DialectLabel;
}) {
  const caption = [
    fields.speaker_name ? `Penutur ${fields.speaker_name}` : null,
    `Dialek ${dialectLabel(fields.dialect_id)}`,
    fields.is_primary ? 'Rekaman utama' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Flex vertical gap={8} style={{ height: '100%', minHeight: 0 }}>
      <SafeAudioPlayer url={fields.url} />
      {caption ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {caption}
        </Text>
      ) : null}
    </Flex>
  );
}

function WordImageDetail({
  fields,
  image,
  hasCensor,
  onRequestCensor,
  onClearCensor,
}: {
  fields: WordImageChildData;
  image?: WordImageView;
  hasCensor?: boolean;
  onRequestCensor?: (image: WordImageView) => void;
  onClearCensor?: (imageId: string) => void;
}) {
  const canCensor = fields.provider === 'imagekit' && image && onRequestCensor;
  const caption = [fields.alt_text, fields.is_primary ? 'Gambar utama' : null].filter(Boolean).join(' · ');

  return (
    <Flex vertical gap={8} style={{ height: '100%', minHeight: 0 }}>
      <Image
        src={fields.url}
        alt={fields.alt_text ?? 'Gambar usulan'}
        style={{ maxHeight: 280, width: 'auto', maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
      />
      {caption ? <Text type="secondary" style={{ fontSize: 12 }}>{caption}</Text> : null}
      {canCensor ? (
        <Space size={4}>
          {hasCensor ? <Tag color="orange">Tersensor</Tag> : null}
          <Button size="small" onClick={() => onRequestCensor(image)}>
            {hasCensor ? 'Edit sensor' : 'Sensor'}
          </Button>
          {hasCensor && onClearCensor ? (
            <Button size="small" type="link" onClick={() => onClearCensor(image.id)}>
              Batalkan sensor
            </Button>
          ) : null}
        </Space>
      ) : null}
    </Flex>
  );
}

function MeaningDetail({ fields }: { fields: MeaningChildData }) {
  const languageLabel = useLanguageLabel();
  const wordClassLabel = useWordClassLabel();
  const className = wordClassLabel(fields.word_class_id);

  return (
    <Flex vertical gap={8} style={{ height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PairGrid
          leftTitle="Makna"
          rightTitle="Terjemahan"
          left={<div style={{ fontSize: 16, lineHeight: 1.5 }}>{fields.definition || '-'}</div>}
          right={
            fields.translations.length === 0 ? (
              <Text type="secondary">-</Text>
            ) : (
              <Flex vertical gap={8}>
                {fields.translations.map((t, index) => (
                  <div key={index}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      {languageLabel(t.language_id)}
                      {t.translation_type && t.translation_type !== 'direct'
                        ? ` (${TRANSLATION_TYPE_LABELS[t.translation_type as keyof typeof TRANSLATION_TYPE_LABELS] ?? t.translation_type})`
                        : ''}
                    </Text>
                    <div style={{ fontSize: 16, lineHeight: 1.5 }}>{t.translation_text || '-'}</div>
                  </div>
                ))}
              </Flex>
            )
          }
        />
      </div>
      {className ? (
        <Text type="secondary" style={{ flex: 'none', fontSize: 12 }}>
          Kelas kata: {className}
        </Text>
      ) : null}
    </Flex>
  );
}

function ExampleDetail({ fields }: { fields: ExampleChildData }) {
  const sourceLabel = fields.source_type
    ? (EXAMPLE_SOURCE_LABELS[fields.source_type as keyof typeof EXAMPLE_SOURCE_LABELS] ?? fields.source_type)
    : null;
  const caption = [sourceLabel, fields.notes ? `Catatan: ${fields.notes}` : null].filter(Boolean).join(' · ');

  return (
    <Flex vertical gap={8} style={{ height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PairGrid
          leftTitle="Kalimat"
          rightTitle="Terjemahan"
          left={<div style={{ fontSize: 16, lineHeight: 1.5 }}>{fields.source_sentence}</div>}
          right={<div style={{ fontSize: 16, lineHeight: 1.5 }}>{fields.target_sentence ?? '-'}</div>}
        />
      </div>
      {caption ? (
        <Text type="secondary" style={{ flex: 'none', fontSize: 12 }}>
          {caption}
        </Text>
      ) : null}
    </Flex>
  );
}