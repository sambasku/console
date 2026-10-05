import { Alert, Button } from 'antd';
import { normalizeError } from '@/shared/api/error';
import { describeFcmRequestError } from '../../application/fcm-provider-state';

/** Gagal request ke API sendiri (bukan gagal provider Google) - tampil sekali per tab. */
export function FcmRequestErrorAlert({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      message="Analitik notifikasi belum bisa dimuat"
      description={describeFcmRequestError(error instanceof Error ? error : normalizeError(error))}
      action={
        <Button size="small" danger onClick={onRetry}>
          Coba lagi
        </Button>
      }
    />
  );
}
