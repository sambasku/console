import { Alert, Button } from 'antd';
import { describePlayRequestError } from '../../application/play-provider-state';

/** Satu alert per tab saat request ke API gagal. */
export function PlayRequestErrorAlert({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      message="Data Play Store gagal dimuat"
      description={describePlayRequestError(error)}
      action={
        <Button size="small" onClick={onRetry}>
          Coba lagi
        </Button>
      }
    />
  );
}
