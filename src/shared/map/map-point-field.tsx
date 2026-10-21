import { Form, InputNumber } from 'antd';
import { MapPicker, type MapPickerProps } from './map-picker';
import type { MapPoint } from './nominatim';

type FieldProps = Omit<MapPickerProps, 'value' | 'onChange'> & {
  latName?: string;
  lngName?: string;
};

function toCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Sambungan MapPicker ke form Ant Design yang menyimpan `lat` dan `lng` terpisah. */
export function MapPointField({ latName = 'lat', lngName = 'lng', ...picker }: FieldProps) {
  const form = Form.useFormInstance();
  const watchedLat = Form.useWatch(latName, form);
  const watchedLng = Form.useWatch(lngName, form);
  // useWatch render pertama selalu undefined. Store form sudah terisi setFieldsValue.
  const lat = toCoord(watchedLat) ?? toCoord(form.getFieldValue(latName));
  const lng = toCoord(watchedLng) ?? toCoord(form.getFieldValue(lngName));
  const value: MapPoint | null = lat != null && lng != null ? { lat, lng } : null;

  return (
    <>
      <Form.Item name={latName} hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name={lngName} hidden>
        <InputNumber />
      </Form.Item>
      <MapPicker
        {...picker}
        value={value}
        onChange={(point) => {
          form.setFieldValue(latName, point?.lat ?? null);
          form.setFieldValue(lngName, point?.lng ?? null);
        }}
      />
    </>
  );
}
