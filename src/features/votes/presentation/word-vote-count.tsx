import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Flex, Skeleton, Tag, Typography, theme } from 'antd';
import { MAX_VOTE_TARGETS } from '../domain/vote';
import { sumVoteCounts, toVoteCountMap, useVoteCounts } from '../application/use-vote-counts';

const { Text } = Typography;

/**
 * Ringkasan vote MAKNA sebuah kata (READ-ONLY) - `GET /api/v1/votes/counts`
 * untuk target `meaning:<id>` tiap makna, lalu dijumlahkan.
 *
 * 0101 memensiunkan vote level kata: `word:<id>` tidak menerima vote baru
 * dan baris lamanya dihapus backfill 0105, jadi membaca `word:` akan selalu
 * tampil 0 dan menyesatkan admin. Admin mengawasi engagement, bukan memilih.
 */
export function WordVoteCount({ meaningIds }: { meaningIds: string[] }) {
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
    </Flex>
  );
}
