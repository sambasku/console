import { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Flex, Input, Popconfirm, Result, Select, Table, Tabs, Tooltip, Typography } from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { useAuth } from '@/shared/auth/use-auth';
import { formatDateTime, formatDateTimeSeconds } from '@/shared/utils/format-datetime';
import {
  useAnonAbuseEvents,
  useAnonMutes,
  useLiftAnonMute,
  useUserAbuseEvents,
  type AnonAbuseFilters,
  type UserAbuseFilters,
} from '../application/use-abuse';
import {
  ANON_SIGNALS,
  SIGNAL_LABELS,
  SUBJECT_KIND_LABELS,
  USER_SIGNALS,
  summarizeMeta,
  type AnonAbuseEvent,
  type AnonMute,
  type AnonSubjectKind,
  type UserAbuseEvent,
} from '../domain/abuse';
import {
  ContributeStatusTag,
  LiftUserMuteButton,
  SignalTag,
  UserAbuseDrawer,
  type AbuseDrawerUser,
} from './user-abuse-drawer';

const signalOptions = (signals: readonly string[]) =>
  signals.map((s) => ({ value: s, label: SIGNAL_LABELS[s] ?? s }));

function MetaCell({ meta }: { meta: Record<string, unknown> | null }) {
  const text = summarizeMeta(meta);
  return (
    <Tooltip title={meta ? <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(meta, null, 2)}</pre> : undefined}>
      <Typography.Text type="secondary" ellipsis style={{ maxWidth: 220, fontSize: 12 }}>
        {text}
      </Typography.Text>
    </Tooltip>
  );
}

function EntityCell({ type, id }: { type: string | null; id: string | null }) {
  if (!type) return <Typography.Text type="secondary">-</Typography.Text>;
  return (
    <Tooltip title={id ?? undefined}>
      <Typography.Text code>{type}</Typography.Text>
    </Tooltip>
  );
}

function ListFooter({ count, hasMore, loadMore, loading }: { count: number; hasMore: boolean; loadMore: () => void; loading: boolean }) {
  return (
    <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
      <Typography.Text type="secondary">{count} entri dimuat</Typography.Text>
      {hasMore ? (
        <Button onClick={loadMore} loading={loading}>
          Muat lagi
        </Button>
      ) : null}
    </Flex>
  );
}

const userColumnHelper = createColumnHelper<UserAbuseEvent>();

function UserEventsTab() {
  const [filters, setFilters] = useState<UserAbuseFilters>({});
  const [userNameInput, setUserNameInput] = useState('');
  const [drawerUser, setDrawerUser] = useState<AbuseDrawerUser | null>(null);
  const { items, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useUserAbuseEvents(filters, true);

  // Status terbaru dari list (setelah cabut mute, list di-invalidate).
  const fresh = drawerUser ? items.find((e) => e.user_id === drawerUser.id) : undefined;
  const drawerUserFresh: AbuseDrawerUser | null = drawerUser
    ? fresh
      ? { ...drawerUser, canContribute: fresh.user_can_contribute, mutedUntil: fresh.user_muted_until }
      : drawerUser
    : null;

  const columns = useMemo(
    () => [
      userColumnHelper.accessor('created_at', {
        header: 'Waktu',
        size: 170,
        cell: (info) => formatDateTimeSeconds(info.getValue()),
      }),
      userColumnHelper.accessor('username', {
        header: 'Pengguna',
        size: 160,
        cell: (info) => {
          const row = info.row.original;
          const username = info.getValue() ?? row.user_id;
          return (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() =>
                setDrawerUser({
                  id: row.user_id,
                  username,
                  canContribute: row.user_can_contribute,
                  mutedUntil: row.user_muted_until,
                })
              }
            >
              {username}
            </Button>
          );
        },
      }),
      userColumnHelper.accessor('signal', {
        header: 'Sinyal',
        size: 190,
        cell: (info) => <SignalTag signal={info.getValue()} />,
      }),
      userColumnHelper.accessor('weight', { header: 'Bobot', size: 70 }),
      userColumnHelper.display({
        id: 'entity',
        header: 'Entitas',
        size: 120,
        meta: { responsive: ['lg'] },
        cell: (info) => <EntityCell type={info.row.original.entity_type} id={info.row.original.entity_id} />,
      }),
      userColumnHelper.accessor('meta', {
        header: 'Detail',
        size: 240,
        meta: { responsive: ['lg'] },
        cell: (info) => <MetaCell meta={info.getValue()} />,
      }),
      userColumnHelper.display({
        id: 'status',
        header: 'Status saat ini',
        size: 220,
        cell: (info) => {
          const row = info.row.original;
          return (
            <Flex gap={8} align="center" wrap>
              <ContributeStatusTag canContribute={row.user_can_contribute} mutedUntil={row.user_muted_until} />
              <LiftUserMuteButton userId={row.user_id} username={row.username ?? row.user_id} mutedUntil={row.user_muted_until} />
            </Flex>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Username…"
          value={userNameInput}
          onChange={(e) => setUserNameInput(e.target.value)}
          onSearch={(v) => setFilters((f) => ({ ...f, userName: v.trim() || undefined }))}
          allowClear
          style={{ width: 220 }}
        />
        <Select
          placeholder="Semua sinyal"
          value={filters.signal}
          onChange={(signal) => setFilters((f) => ({ ...f, signal }))}
          allowClear
          options={signalOptions(USER_SIGNALS)}
          style={{ width: 240 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Muat ulang
        </Button>
      </Flex>

      {isError ? <Alert type="error" showIcon style={{ marginBottom: 16 }} message="Gagal memuat data" description={error?.message} /> : null}

      <DataTable table={table} rowKey={(r) => r.id} loading={isLoading || (isFetching && !items.length)} />
      <ListFooter count={items.length} hasMore={hasMore} loadMore={() => loadMore()} loading={isFetchingNextPage} />

      <UserAbuseDrawer user={drawerUserFresh} onClose={() => setDrawerUser(null)} />
    </>
  );
}

function AnonMutesDrawer({
  open,
  onClose,
  onFocus,
}: {
  open: boolean;
  onClose: () => void;
  onFocus: (kind: AnonSubjectKind, key: string) => void;
}) {
  const mutes = useAnonMutes(true);
  const lift = useLiftAnonMute();
  const rows = mutes.data ?? [];

  return (
    <Drawer
      title={`Mute aktif (${rows.length})`}
      open={open}
      onClose={onClose}
      size="large"
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={() => mutes.refetch()}>
          Muat ulang
        </Button>
      }
    >
      {mutes.isError ? <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Gagal memuat mute aktif" description={mutes.error?.message} /> : null}
      <Table<AnonMute>
        size="small"
        loading={mutes.isLoading}
        dataSource={rows}
        rowKey={(m) => `${m.subject_kind}:${m.subject_key}`}
        pagination={false}
        locale={{ emptyText: 'Tidak ada IP atau perangkat yang sedang di-mute.' }}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Jenis', dataIndex: 'subject_kind', width: 100, render: (k: AnonSubjectKind) => SUBJECT_KIND_LABELS[k] ?? k },
          {
            title: 'IP / Perangkat',
            dataIndex: 'subject_key',
            render: (key: string, m) => (
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => onFocus(m.subject_kind, key)}>
                {key}
              </Button>
            ),
          },
          { title: 'Berlaku s/d', dataIndex: 'muted_until', width: 180, render: (v: string) => formatDateTime(v) },
          {
            title: 'Aksi',
            key: 'actions',
            width: 120,
            render: (_, m) => (
              <Popconfirm
                title={`Cabut mute ${m.subject_key}?`}
                description="Skor abuse ikut direset supaya tidak langsung ter-mute lagi."
                okText="Cabut mute"
                cancelText="Batal"
                onConfirm={() => lift.mutateAsync({ subjectKind: m.subject_kind, subjectKey: m.subject_key })}
              >
                <Button
                  size="small"
                  loading={lift.isPending && lift.variables?.subjectKey === m.subject_key}
                >
                  Cabut mute
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </Drawer>
  );
}

const anonColumnHelper = createColumnHelper<AnonAbuseEvent>();

function AnonTab() {
  const [filters, setFilters] = useState<AnonAbuseFilters>({});
  const [keyInput, setKeyInput] = useState('');
  const [mutesOpen, setMutesOpen] = useState(false);
  const muteCount = useAnonMutes(true).data?.length ?? 0;
  const { items, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useAnonAbuseEvents(filters, true);

  const focusSubject = (kind: AnonSubjectKind, key: string) => {
    setKeyInput(key);
    setFilters((f) => ({ ...f, subjectKind: kind, subjectKey: key }));
  };

  const columns = useMemo(
    () => [
      anonColumnHelper.accessor('created_at', {
        header: 'Waktu',
        size: 170,
        cell: (info) => formatDateTimeSeconds(info.getValue()),
      }),
      anonColumnHelper.accessor('subject_kind', {
        header: 'Jenis',
        size: 100,
        cell: (info) => SUBJECT_KIND_LABELS[info.getValue()] ?? info.getValue(),
      }),
      anonColumnHelper.accessor('subject_key', {
        header: 'IP / Perangkat',
        size: 200,
        cell: (info) => (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => focusSubject(info.row.original.subject_kind, info.getValue())}
          >
            <Typography.Text ellipsis style={{ maxWidth: 180 }}>
              {info.getValue()}
            </Typography.Text>
          </Button>
        ),
      }),
      anonColumnHelper.accessor('signal', {
        header: 'Sinyal',
        size: 170,
        cell: (info) => <SignalTag signal={info.getValue()} />,
      }),
      anonColumnHelper.accessor('weight', { header: 'Bobot', size: 70 }),
      anonColumnHelper.display({
        id: 'entity',
        header: 'Entitas',
        size: 120,
        meta: { responsive: ['lg'] },
        cell: (info) => <EntityCell type={info.row.original.entity_type} id={info.row.original.entity_id} />,
      }),
      anonColumnHelper.accessor('meta', {
        header: 'Detail',
        size: 240,
        meta: { responsive: ['lg'] },
        cell: (info) => <MetaCell meta={info.getValue()} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Select
          placeholder="Semua jenis"
          value={filters.subjectKind}
          onChange={(subjectKind) => setFilters((f) => ({ ...f, subjectKind }))}
          allowClear
          options={(Object.keys(SUBJECT_KIND_LABELS) as AnonSubjectKind[]).map((k) => ({ value: k, label: SUBJECT_KIND_LABELS[k] }))}
          style={{ width: 150 }}
        />
        <Input.Search
          placeholder="IP atau ID perangkat (persis)…"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onSearch={(v) => setFilters((f) => ({ ...f, subjectKey: v.trim() || undefined }))}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="Semua sinyal"
          value={filters.signal}
          onChange={(signal) => setFilters((f) => ({ ...f, signal }))}
          allowClear
          options={signalOptions(ANON_SIGNALS)}
          style={{ width: 200 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Muat ulang
        </Button>
        <Button danger={muteCount > 0} onClick={() => setMutesOpen(true)}>
          Mute aktif ({muteCount})
        </Button>
      </Flex>

      {isError ? <Alert type="error" showIcon style={{ marginBottom: 16 }} message="Gagal memuat data" description={error?.message} /> : null}

      <DataTable table={table} rowKey={(r) => r.id} loading={isLoading || (isFetching && !items.length)} />
      <ListFooter count={items.length} hasMore={hasMore} loadMore={() => loadMore()} loading={isFetchingNextPage} />

      <AnonMutesDrawer
        open={mutesOpen}
        onClose={() => setMutesOpen(false)}
        onFocus={(kind, key) => {
          focusSubject(kind, key);
          setMutesOpen(false);
        }}
      />
    </>
  );
}

/**
 * Halaman Abuse (role: admin & root) - pantau ledger abuse UGC yang ditulis
 * policy otomatis: tab Akun (`ugc_abuse_events`) dan tab Anonim
 * (`ugc_anon_abuse_events` + mute IP/perangkat). Cabut mute ikut reset skor.
 */
export function AbusePage() {
  const { user } = useAuth();
  const canView = user?.role === 'admin' || user?.role === 'root';

  if (!canView) {
    return <Result status="403" title="Akses ditolak" subTitle="Halaman abuse hanya untuk role admin dan root." />;
  }

  return (
    <>
      <PageHeader
        title="Abuse"
        subtitle="Sinyal abuse konten pengguna dan tamu, mute otomatis, dan pencabutan mute - hanya admin & root."
      />
      <Tabs
        items={[
          { key: 'user', label: 'Akun', children: <UserEventsTab /> },
          { key: 'anon', label: 'Anonim (IP / perangkat)', children: <AnonTab /> },
        ]}
      />
    </>
  );
}
