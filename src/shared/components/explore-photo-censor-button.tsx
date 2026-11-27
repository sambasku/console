import { useState } from 'react';
import { App as AntdApp, Button, Modal } from 'antd';
import { normalizeError } from '@/shared/api/error';
import {
  censorExplorePhotoRequest,
  takedownExplorePhotoRequest,
  type ExplorePhotoModule,
} from '@/shared/api/explore-photo-api';
import { ImageCensorEditor } from '@/features/discussions/presentation/image-censor-editor';

export interface ExplorePhotoModerationActionsProps {
  module: ExplorePhotoModule;
  entityId?: string;
  imageId?: string;
  imageUrl: string;
  onCensored: (newUrl: string) => void;
  onTakedown?: () => void;
}

export function ExplorePhotoModerationActions({
  module,
  entityId,
  imageId,
  imageUrl,
  onCensored,
  onTakedown,
}: ExplorePhotoModerationActionsProps) {
  const { message, modal } = AntdApp.useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!entityId || !imageUrl) return null;

  const handleApply = async (blob: Blob) => {
    setBusy(true);
    try {
      const res = await censorExplorePhotoRequest(module, entityId, {
        imageId,
        imageUrl,
        blob,
      });
      message.success('Foto tersensor disimpan');
      setOpen(false);
      onCensored(res.url);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleTakedown = () => {
    modal.confirm({
      title: 'Takedown foto ini?',
      content: 'Foto akan disembunyikan dari publik dan feed aktivitas.',
      okText: 'Takedown',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await takedownExplorePhotoRequest(module, entityId, { imageId, imageUrl });
          message.success('Foto di-takedown');
          onTakedown?.();
        } catch (err) {
          message.error(normalizeError(err).message);
        }
      },
    });
  };

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        Sensor
      </Button>
      {onTakedown ? (
        <Button size="small" danger onClick={handleTakedown}>
          Takedown
        </Button>
      ) : null}
      <Modal
        open={open}
        title="Sensor foto eksplorasi"
        footer={null}
        width={720}
        destroyOnClose
        onCancel={() => setOpen(false)}
      >
        <ImageCensorEditor
          imageUrl={imageUrl}
          disabled={busy}
          confirmLabel="Simpan foto tersensor"
          onApply={handleApply}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
