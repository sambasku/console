import { Space, Tag, Typography } from 'antd';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { AUDIT_ACTION_TAG_COLOR } from '../domain/audit-log';
import type { AuditLogListItem } from '../domain/audit-log';
import { AuditChangesCell } from './audit-changes-cell';

const { Text } = Typography;

const ENTITY_LABELS: Record<string, string> = {
  word: 'Kata',
  meaning: 'Makna',
  example: 'Contoh',
  pronunciation: 'Pelafalan',
  word_image: 'Gambar',
  word_audio: 'Audio',
};

/**
 * Timeline riwayat audit satu entitas (dipakai tab Riwayat di detail kata).
 * Entri sudah terbaru-dulu dari API (cursor pagination).
 */
export function AuditTimeline({ items }: { items: AuditLogListItem[] }) {
  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {items.map((log) => (
        <div
          key={log.id}
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <Space size={8} wrap>
            <Tag color={AUDIT_ACTION_TAG_COLOR[log.action] ?? 'default'}>{log.action}</Tag>
            <Tag>{ENTITY_LABELS[log.entity_type] ?? log.entity_type}</Tag>
            <Text strong>{log.user_display_name || log.user_name || 'Sistem'}</Text>
            <Text type="secondary">{formatDateTime(log.created_at)}</Text>
          </Space>
          <div style={{ marginTop: 6 }}>
            <AuditChangesCell oldData={log.old_data} newData={log.new_data} />
          </div>
        </div>
      ))}
    </Space>
  );
}
