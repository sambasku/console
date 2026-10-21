import { useEffect, useRef, useState } from 'react';
import { InboxOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Image, Input, Space, Tag, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { ApiError, normalizeError } from '@/shared/api/error';
import { displayImageUrl } from '@/shared/utils/display-image-url';
import { uploadPlaceImage } from '../infrastructure/place-image-api';

const MAX_ORIGINAL_MB = 20;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export interface PlaceImageDraft {
  uid: string;
  url: string;
  isMain: boolean;
  attributionName: string;
  attributionProvider: string;
  status: 'done' | 'uploading' | 'error';
  progress?: number;
  localUrl?: string;
  fileName?: string;
}

export function PlaceImagesField({
  value,
  onChange,
}: {
  value?: PlaceImageDraft[];
  onChange?: (next: PlaceImageDraft[]) => void;
}) {
  const { message } = AntdApp.useApp();
  const [images, setLocal] = useState<PlaceImageDraft[]>(() => value ?? []);
  const imagesRef = useRef(value ?? []);
  const [urlDraft, setUrlDraft] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (value === undefined) return;
    if (value === imagesRef.current) return;
    imagesRef.current = value;
    setLocal(value);
  }, [value]);

  const setImages = (next: PlaceImageDraft[]) => {
    imagesRef.current = next;
    setLocal(next);
    onChange?.(next);
  };

  const patch = (uid: string, changes: Partial<PlaceImageDraft>) =>
    setImages(imagesRef.current.map((img) => (img.uid === uid ? { ...img, ...changes } : img)));

  const setMain = (uid: string) =>
    setImages(imagesRef.current.map((img) => ({ ...img, isMain: img.uid === uid })));

  const remove = (uid: string) => {
    const img = imagesRef.current.find((i) => i.uid === uid);
    if (img?.localUrl) URL.revokeObjectURL(img.localUrl);
    const next = imagesRef.current.filter((i) => i.uid !== uid);
    if (next.length > 0 && !next.some((i) => i.isMain)) next[0] = { ...next[0], isMain: true };
    setImages(next);
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url.startsWith('https://')) {
      message.warning('URL foto harus https');
      return;
    }
    const uid = `url-${imagesRef.current.length}-${url.length}`;
    setImages([
      ...imagesRef.current,
      {
        uid,
        url,
        isMain: imagesRef.current.length === 0,
        attributionName: '',
        attributionProvider: 'sambasku',
        status: 'done',
        fileName: url,
      },
    ]);
    setUrlDraft('');
  };

  const startUpload = async (file: File, uid: string) => {
    const localUrl = URL.createObjectURL(file);
    setImages([
      ...imagesRef.current,
      {
        uid,
        url: '',
        isMain: imagesRef.current.length === 0,
        attributionName: '',
        attributionProvider: 'sambasku',
        status: 'uploading',
        progress: 0,
        localUrl,
        fileName: file.name,
      },
    ]);
    try {
      const url = await uploadPlaceImage(file, (percent) => patch(uid, { progress: percent }));
      const oldLocal = imagesRef.current.find((i) => i.uid === uid)?.localUrl;
      patch(uid, { status: 'done', url, localUrl: undefined, progress: 100 });
      if (oldLocal) queueMicrotask(() => URL.revokeObjectURL(oldLocal));
      setUnavailable(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) setUnavailable(true);
      patch(uid, { status: 'error' });
      message.error(normalizeError(err).message || `Gagal mengunggah ${file.name}`);
    }
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const typed = file as File & { uid?: string };
    if (!ACCEPTED.includes(typed.type)) {
      message.warning(`${typed.name}: hanya jpg, png, atau webp`);
      return Upload.LIST_IGNORE;
    }
    if (typed.size > MAX_ORIGINAL_MB * 1024 * 1024) {
      message.warning(`${typed.name}: melebihi ${MAX_ORIGINAL_MB} MB`);
      return Upload.LIST_IGNORE;
    }
    const uid =
      typed.uid ?? `f-${typed.name}-${typed.size}-${typed.lastModified}-${imagesRef.current.length}`;
    void startUpload(typed, uid);
    return false;
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Typography.Text type="secondary">
        Jumlah foto tidak dibatasi. Satu foto ditandai utama. Kredit nama diisi kalau fotonya
        bukan milik kamu.
      </Typography.Text>
      {unavailable ? (
        <Typography.Text type="warning">
          Unggah file belum aktif di server. Tempel URL https tetap bisa dipakai.
        </Typography.Text>
      ) : null}
      {!unavailable ? (
        <Upload.Dragger
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          showUploadList={false}
          beforeUpload={beforeUpload}
        >
          <p className="ant-upload-drag-icon">
            {images.length === 0 ? <InboxOutlined /> : <PlusOutlined />}
          </p>
          <p className="ant-upload-text">
            {images.length === 0 ? 'Klik atau seret foto ke sini' : 'Tambah foto lagi'}
          </p>
          <p className="ant-upload-hint">
            {images.length === 0
              ? 'jpg, png, atau webp. Bisa lebih dari satu sekaligus.'
              : `${images.length} foto.`}
          </p>
        </Upload.Dragger>
      ) : null}
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Atau tempel URL https"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onPressEnter={addUrl}
        />
        <Button onClick={addUrl}>Tambah URL</Button>
      </Space.Compact>
      {images.map((img) => {
        const src = img.localUrl ?? displayImageUrl(img.url, { width: 160 }) ?? img.url;
        return (
          <div
            key={img.uid}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8,
              padding: 8,
            }}
          >
            <div style={{ width: 88, height: 88, flexShrink: 0, position: 'relative' }}>
              {src ? (
                <Image
                  src={src}
                  width={88}
                  height={88}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                  preview={Boolean(img.url)}
                  alt={img.fileName ?? 'Foto wisata'}
                />
              ) : (
                <LoadingOutlined />
              )}
              {img.isMain && img.status === 'done' ? (
                <Tag color="blue" style={{ position: 'absolute', left: 4, bottom: 4, margin: 0 }}>
                  Utama
                </Tag>
              ) : null}
            </div>
            <Space direction="vertical" size={6} style={{ flex: 1 }}>
              <Typography.Text type={img.status === 'error' ? 'danger' : 'secondary'}>
                {img.status === 'uploading'
                  ? `Mengunggah ${img.progress ?? 0}%`
                  : img.status === 'error'
                    ? 'Gagal unggah. Hapus baris ini lalu coba lagi.'
                    : img.fileName || img.url}
              </Typography.Text>
              <Input
                placeholder="Kredit foto (nama)"
                value={img.attributionName}
                disabled={img.status !== 'done'}
                onChange={(e) => patch(img.uid, { attributionName: e.target.value })}
              />
              <Input
                placeholder="Provider (sambasku, wikimedia, ...)"
                value={img.attributionProvider}
                disabled={img.status !== 'done'}
                onChange={(e) => patch(img.uid, { attributionProvider: e.target.value })}
              />
              <Space>
                <Button size="small" disabled={img.isMain || img.status !== 'done'} onClick={() => setMain(img.uid)}>
                  Jadikan utama
                </Button>
                <Button size="small" danger onClick={() => remove(img.uid)}>
                  Hapus
                </Button>
              </Space>
            </Space>
          </div>
        );
      })}
    </Space>
  );
}
