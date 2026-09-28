import { useState } from 'react';
import { App as AntdApp, Button, Input, Space, Typography, Upload } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { displayImageUrl } from '@/shared/utils/display-image-url';
import { uploadCampaignImage } from '../infrastructure/campaign-image-api';

const ACCEPTED = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

interface Props {
  value?: string | null;
  onChange?: (url: string | null) => void;
}

/**
 * Upload file (WebP compress) atau paste HTTPS URL untuk gambar campaign.
 * Nilai form = URL publik final (atau null).
 */
export function CampaignImageField({ value, onChange }: Props) {
  const { message } = AntdApp.useApp();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const setUrl = (url: string | null) => {
    onChange?.(url);
  };

  const onPick = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.warning('Pilih file gambar (jpg/png/webp)');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadCampaignImage(file, setProgress);
      setUrl(url);
      message.success('Gambar diunggah');
    } catch (err) {
      message.warning(normalizeError(err).message);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const preview = displayImageUrl(value, { width: 320, height: 180 });

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space wrap>
          <Upload
            accept={ACCEPTED}
            showUploadList={false}
            beforeUpload={(file) => {
              void onPick(file);
              return false;
            }}
            disabled={uploading}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              {uploading && progress != null ? `Unggah ${progress}%` : 'Unggah gambar'}
            </Button>
          </Upload>
          {value ? (
            <Button
              icon={<DeleteOutlined />}
              danger
              type="text"
              onClick={() => setUrl(null)}
              disabled={uploading}
            >
              Hapus
            </Button>
          ) : null}
        </Space>
        <Input
          placeholder="Atau tempel URL HTTPS publik"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value.trim();
            setUrl(v || null);
          }}
          disabled={uploading}
          allowClear
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Opsional. File dikompres ke WebP (maks 720px). Tray Android + inbox menampilkan gambar ini.
        </Typography.Text>
        {preview ? (
          <img
            src={preview}
            alt="Pratinjau gambar campaign"
            style={{
              maxWidth: '100%',
              maxHeight: 160,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid #d9d9d9',
            }}
          />
        ) : null}
      </Space>
    </div>
  );
}
