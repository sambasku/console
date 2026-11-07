import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Drawer,
  Flex,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { MAX_VOTE_TARGETS } from '../domain/vote';
import type { WordMeaningOption, WordVoterListItem } from '../domain/word-voters';
import { sumVoteCounts, toVoteCountMap, useVoteCounts, isVoteCountsReader } from '../application/use-vote-counts';
import { useWordVoters } from '../application/use-word-voters';

const { Text } = Typography;

/**
 * Ringkasan vote MAKNA sebuah kata (READ-ONLY) - `GET /api/v1/votes/counts`
 * untuk target `meaning:<id>` tiap makna, lalu dijumlahkan.
 *
 * 0101 memensiunkan vote level kata: `word:<id>` tidak menerima vote baru
 * dan baris lamanya dihapus backfill 0105, jadi membaca `word:` akan selalu
 * tampil 0 dan menyesatkan admin. Admin mengawasi engagement, bukan memilih.
 *
 * Role root/admin/reviewer: tombol **Lihat voter** → drawer daftar orang.
 */
export function WordVoteCount({
  wordId,
  meaningIds,
  meanings = [],
}: {
  wordId: string;
  meaningIds: string[];
  meanings?: WordMeaningOption[];
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const canSeeVoters = isVoteCountsReader(user?.role);
  const targets = meaningIds
    .slice(0, MAX_VOTE_TARGETS)
    .map((id) => `meaning:${id}`);
  const baselineColor = theme.useToken().token.colorTextSecondary;
  const { data, isLoading, isError } = useVoteCounts(targets);

  if (meaningIds.length === 0) {
    return <Text type="secondary">Belum ada makna</Text>;
  }

  if (isLoading) {
    return <Skeleton.Node active style={{ width: 180, height: 32 }} />;
  }

  if (isError || !data) {
    return (
      <Text type="secondary" style={{ color: baselineColor }}>
        Vote tidak tersedia
      </Text>
    );
  }

  const counts = toVoteCountMap(data);
  const { upvotes, downvotes } = sumVoteCounts(counts, targets);

  return (
    <>
      <Flex gap={8} align="center" wrap>
        <Tag icon={<CaretUpOutlined />} color="green">
          {upvotes}
        </Tag>
        <Tag icon={<CaretDownOutlined />} color="red">
          {downvotes}
        </Tag>
        <Text type="secondary">Skor {upvotes - downvotes}</Text>
        {meaningIds.length > MAX_VOTE_TARGETS ? (
          <Text type="secondary">({MAX_VOTE_TARGETS} makna pertama)</Text>
        ) : null}
        {canSeeVoters ? (
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => setOpen(true)}
            style={{ paddingInline: 0 }}
          >
            Lihat voter
          </Button>
        ) : null}
      </Flex>

      <WordVotersDrawer
        open={open}
        onClose={() => setOpen(false)}
        wordId={wordId}
        meanings={meanings.length > 0 ? meanings : meaningIds.map((id, i) => ({ id, label: `Makna ${i + 1}` }))}
      />
    </>
  );
}

function WordVotersDrawer({
  open,
  onClose,
  wordId,
  meanings,
}: {
  open: boolean;
  onClose: () => void;
  wordId: string;
  meanings: WordMeaningOption[];
}) {
  const [meaningId, setMeaningId] = useState<string | undefined>();
  const [value, setValue] = useState<1 | -1 | undefined>();

  const { items, totals, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useWordVoters({
      wordId,
      meaningId,
      value,
      enabled: open,
    });

  const columns = useMemo(
    () => [
      {
        title: 'Pengguna',
        key: 'voter',
        render: (_: unknown, row: WordVoterListItem) => (
          <div>
            <Text strong>{row.voterUsername}</Text>
            <br />
            <Text italic type="secondary" style={{ fontSize: 12 }}>
              {row.voterEmail}
            </Text>
          </div>
        ),
      },
      {
        title: 'Makna',
        key: 'meaning',
        ellipsis: true,
        render: (_: unknown, row: WordVoterListItem) =>
          row.meaningPreview?.trim() || (
            <Text type="secondary">Makna dihapus / tidak ditemukan</Text>
          ),
      },
      {
        title: 'Nilai',
        dataIndex: 'value',
        key: 'value',
        width: 120,
        render: (v: 1 | -1) =>
          v === 1 ? (
            <Tag icon={<CaretUpOutlined />} color="green">
              Upvote
            </Tag>
          ) : (
            <Tag icon={<CaretDownOutlined />} color="red">
              Downvote
            </Tag>
          ),
      },
      {
        title: 'Waktu',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 170,
        render: (iso: string) => formatDateTime(iso),
      },
    ],
    [],
  );

  return (
    <Drawer
      title="Voter kata ini"
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          {totals ? (
            <Text type="secondary">
              ↑ {totals.upvotes} · ↓ {totals.downvotes}
            </Text>
          ) : null}
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Muat ulang
          </Button>
        </Space>
      }
    >
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Semua makna"
          style={{ minWidth: 220 }}
          value={meaningId}
          onChange={(v) => setMeaningId(v)}
          options={meanings.map((m) => ({ value: m.id, label: m.label }))}
        />
        <Select
          allowClear
          placeholder="Semua nilai"
          style={{ minWidth: 140 }}
          value={value}
          onChange={(v) => setValue(v)}
          options={[
            { value: 1, label: '↑ Upvote' },
            { value: -1, label: '↓ Downvote' },
          ]}
        />
        <Link to="/vote-moderation">Kelola di Moderasi Vote</Link>
      </Flex>

      {isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat voter"
          description={error ? normalizeError(error).message : undefined}
        />
      ) : null}

      <Table<WordVoterListItem>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={items}
        pagination={false}
        loading={isLoading || (isFetching && !items.length)}
        locale={{ emptyText: 'Belum ada yang vote' }}
      />

      <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
        <Text type="secondary">{items.length} voter dimuat</Text>
        {hasMore ? (
          <Button onClick={() => loadMore()} loading={isFetchingNextPage}>
            Muat lagi
          </Button>
        ) : null}
      </Flex>
    </Drawer>
  );
}
