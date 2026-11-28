import { useMemo, useState } from 'react';
import { App as AntdApp, Button, Flex, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { GiftOutlined, RollbackOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { formatDate } from '@/shared/utils/format-datetime';
import { LOAN_STATUS_LABEL, formatRupiah, type Loan, type LoanStatus, type Rekening } from '../domain/cashflow';
import { useCashflowLoans, useCashflowRekening, useHibahLoan } from '../application/use-cashflow';
import { ReimburseDialog } from './cashflow-dialogs';

const STATUS_COLOR: Record<LoanStatus, string> = {
  outstanding: 'orange',
  lunas: 'green',
  dihibahkan: 'blue',
  dibatalkan: 'default',
};

/** Tab talangan: siapa menalangi, berapa yang sudah kembali, dan sisanya. */
export function TalanganTab() {
  const { message } = AntdApp.useApp();
  const loansQ = useCashflowLoans();
  const rekeningQ = useCashflowRekening();
  const hibah = useHibahLoan();
  const [reimburseTarget, setReimburseTarget] = useState<Loan | null>(null);

  const loans = useMemo(() => loansQ.data ?? [], [loansQ.data]);
  const rekening: Rekening[] = useMemo(() => rekeningQ.data ?? [], [rekeningQ.data]);
  const totalSisa = loans.filter((l) => l.status === 'outstanding').reduce((acc, l) => acc + l.sisa, 0);

  const handleHibah = async (loan: Loan) => {
    try {
      await hibah.mutateAsync({ id: loan.id, catatan: 'Dihibahkan dari halaman talangan' });
      message.success(`Talangan ${loan.penalang_nama} dihibahkan`);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Flex vertical gap={16}>
      <Typography.Text>
        Total talangan yang belum kembali: <strong>{formatRupiah(totalSisa)}</strong>
      </Typography.Text>

      <Table<Loan>
        rowKey="id"
        loading={loansQ.isLoading}
        dataSource={loans}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: 760 }}
        locale={{ emptyText: 'Belum ada talangan. Talangan muncul saat kamu catat uang keluar dengan kas kurang.' }}
        columns={[
          { title: 'Penalang', dataIndex: 'penalang_nama', key: 'penalang_nama' },
          { title: 'Tanggal', dataIndex: 'tanggal_talangan', key: 'tanggal_talangan', width: 130, render: (v: string) => formatDate(v) },
          { title: 'Pokok', dataIndex: 'pokok', key: 'pokok', width: 140, align: 'right', render: (v: number) => formatRupiah(v) },
          { title: 'Sudah kembali', dataIndex: 'reimbursed', key: 'reimbursed', width: 150, align: 'right', render: (v: number) => formatRupiah(v) },
          {
            title: 'Sisa',
            dataIndex: 'sisa',
            key: 'sisa',
            width: 140,
            align: 'right',
            render: (v: number, row: Loan) => (row.status === 'outstanding' ? <strong>{formatRupiah(v)}</strong> : '-'),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (v: LoanStatus) => <Tag color={STATUS_COLOR[v]}>{LOAN_STATUS_LABEL[v]}</Tag>,
          },
          {
            title: '',
            key: 'ops',
            width: 240,
            render: (_: unknown, row: Loan) => {
              if (row.status !== 'outstanding') return null;
              return (
                <Space>
                  <Button size="small" type="primary" icon={<RollbackOutlined />} onClick={() => setReimburseTarget(row)}>
                    Kembalikan
                  </Button>
                  <Popconfirm
                    title="Hibahkan talangan ini?"
                    description="Status jadi Dihibahkan dan sisanya tidak bisa dikembalikan lewat reimburse lagi."
                    okText="Hibahkan"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleHibah(row)}
                  >
                    <Button size="small" icon={<GiftOutlined />} loading={hibah.isPending}>
                      Hibahkan
                    </Button>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />

      {loansQ.isError ? <Typography.Text type="danger">{normalizeError(loansQ.error).message}</Typography.Text> : null}
      {reimburseTarget ? (
        <ReimburseDialog loan={reimburseTarget} rekening={rekening} onClose={() => setReimburseTarget(null)} />
      ) : null}
    </Flex>
  );
}
