import { Alert, Button, Drawer, Flex, List, Popconfirm, Tag, Typography } from 'antd';
import { formatDateTime, formatDateTimeSeconds } from '@/shared/utils/format-datetime';
import { useLiftUserMute, useUserAbuseHistory } from '../application/use-abuse';
import { isMutedNow, SIGNAL_COLORS, SIGNAL_LABELS, summarizeMeta } from '../domain/abuse';

export function SignalTag({ signal }: { signal: string }) {
  return <Tag color={SIGNAL_COLORS[signal] ?? 'default'}>{SIGNAL_LABELS[signal] ?? signal}</Tag>;
}

/** Status gate kontribusi user saat ini (dihentikan > dibatasi sementara > normal). */
export function ContributeStatusTag({
  canContribute,
  mutedUntil,
}: {
  canContribute: boolean | null;
  mutedUntil: string | null;
}) {
  if (canContribute === false) return <Tag color="red">Kontribusi dihentikan</Tag>;
  if (isMutedNow(mutedUntil)) return <Tag color="orange">Dibatasi s/d {formatDateTime(mutedUntil)}</Tag>;
  return null;
}

export function LiftUserMuteButton({
  userId,
  username,
  mutedUntil,
}: {
  userId: string;
  username: string;
  mutedUntil: string | null;
}) {
  const lift = useLiftUserMute();
  if (!isMutedNow(mutedUntil)) return null;
  return (
    <Popconfirm
      title={`Cabut mute "${username}"?`}
      description="Skor abuse ikut direset supaya tidak langsung ter-mute lagi."
      okText="Cabut mute"
      cancelText="Batal"
      onConfirm={() => lift.mutateAsync({ userId, username })}
    >
      <Button size="small" loading={lift.isPending && lift.variables?.userId === userId}>
        Cabut mute
      </Button>
    </Popconfirm>
  );
}

export interface AbuseDrawerUser {
  id: string;
  username: string;
  canContribute: boolean | null;
  mutedUntil: string | null;
}

/** Riwayat sinyal abuse satu user + aksi cabut mute. */
export function UserAbuseDrawer({ user, onClose }: { user: AbuseDrawerUser | null; onClose: () => void }) {
  const { items, hasMore, loadMore, isLoading, isFetchingNextPage, isError, error } = useUserAbuseHistory(user?.id);

  return (
    <Drawer title={user ? `Riwayat abuse - ${user.username}` : 'Riwayat abuse'} open={!!user} onClose={onClose} size="large" destroyOnHidden>
      {user ? (
        <Flex gap={8} align="center" wrap style={{ marginBottom: 16 }}>
          <ContributeStatusTag canContribute={user.canContribute} mutedUntil={user.mutedUntil} />
          <LiftUserMuteButton userId={user.id} username={user.username} mutedUntil={user.mutedUntil} />
        </Flex>
      ) : null}

      {isError ? <Alert type="error" showIcon style={{ marginBottom: 16 }} message="Gagal memuat riwayat" description={error?.message} /> : null}

      <List
        loading={isLoading}
        dataSource={items}
        locale={{ emptyText: 'Belum ada sinyal abuse.' }}
        renderItem={(e) => (
          <List.Item>
            <Flex vertical gap={4} style={{ width: '100%' }}>
              <Flex gap={8} align="center" wrap>
                <SignalTag signal={e.signal} />
                <Typography.Text type="secondary">bobot {e.weight}</Typography.Text>
                <Typography.Text type="secondary" style={{ marginLeft: 'auto' }}>
                  {formatDateTimeSeconds(e.created_at)}
                </Typography.Text>
              </Flex>
              {e.entity_type ? (
                <Typography.Text code style={{ fontSize: 12 }}>
                  {e.entity_type}
                  {e.entity_id ? ` ${e.entity_id}` : ''}
                </Typography.Text>
              ) : null}
              {e.meta ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {summarizeMeta(e.meta)}
                </Typography.Text>
              ) : null}
            </Flex>
          </List.Item>
        )}
      />
      {hasMore ? (
        <Flex justify="center" style={{ marginTop: 12 }}>
          <Button onClick={() => loadMore()} loading={isFetchingNextPage}>
            Muat lagi
          </Button>
        </Flex>
      ) : null}
    </Drawer>
  );
}
