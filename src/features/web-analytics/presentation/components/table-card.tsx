import { Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

export interface TableCardProps<T> {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: TableColumnsType<T>;
  rowKey: keyof T & string;
}

/** Tabel ranking ringkas (tanpa paginasi) - API sudah membatasi jumlah baris. */
export function TableCard<T extends object>({ title, subtitle, rows, columns, rowKey }: TableCardProps<T>) {
  return (
    <section className="dashboard__chart traffic__table" aria-label={title}>
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            {title}
          </Typography.Title>
          {subtitle ? (
            <Typography.Text type="secondary" className="dashboard__chart-subtitle">
              {subtitle}
            </Typography.Text>
          ) : null}
        </div>
      </div>
      <Table<T>
        size="small"
        pagination={false}
        rowKey={rowKey}
        dataSource={rows}
        columns={columns}
        locale={{ emptyText: 'Belum ada data' }}
        scroll={{ x: 'max-content' }}
      />
    </section>
  );
}