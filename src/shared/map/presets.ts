import type { MapBias, MapPoint } from './nominatim';

/** Pusat Kabupaten Sambas. Pemakai MapPicker yang bukan Sambas jangan impor ini. */
export const SAMBAS_CENTER: MapPoint = { lat: 1.3617, lng: 109.313 };

export const SAMBAS_BIAS: MapBias = {
  south: 0.8,
  west: 108.5,
  north: 2.0,
  east: 110.1,
};
