import { Alert, Button } from 'antd';
import { describeRequestError } from '../../application/provider-state';

/** Satu alert per tab saat request ke API gagal - berlaku untuk semua provider di tab itu. */
export function RequestErrorAlert({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      message="Data trafik gagal dimuat"
      description={describeRequestError(error)}
      action={
        <Button size="small" onClick={onRetry}>
          Coba lagi
        </Button>
      }
    />
  );
}
