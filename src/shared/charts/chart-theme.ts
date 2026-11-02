/**
 * Tema chart analitik gaya Cloudflare: kurva halus, area fill tipis,
 * grid putus-putus tipis, axis tanpa garis, tooltip crosshair + marker.
 * Dipakai bersama oleh semua komponen chart tren di console.
 */

export type ChartRow = {
  date: string;
  dateLabel: string;
  series: string;
  value: number;
};

/**
 * Palet 8 warna unik, sengaja BUKAN token antd: colorInfo default antd =
 * colorPrimary (#1677ff), itu penyebab "Kontribusi" dan "User baru" dulu
 * sama warna. Hex tetap = stabil antar render.
 */
export const CHART_PALETTE = [
  '#2563eb', // blue - Kontribusi / Pengguna aktif
  '#059669', // emerald - Vote / User baru
  '#f59e0b', // amber - Komentar / Sesi
  '#8b5cf6', // violet - Pencarian / series keempat
  '#e11d48', // rose
  '#0891b2', // cyan
  '#ea580c', // orange
  '#64748b', // slate
] as const;

export function seriesColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Area fill: warna series flat dengan opacity sangat tipis. Gradient
 * (tint pucat -> warna penuh + fillOpacity) dulu membuat blok warna solid
 * yang mengganggu; parser @antv/g 2.x juga mengabaikan alpha di color stop.
 */

export interface TrendChartThemeConfig {
  data: ChartRow[];
  /** Warna per urutan series (harus cocok dengan urutan legenda HTML). */
  colors: string[];
  height: number;
  tooltip: {
    title: (d: ChartRow) => string;
    items: Array<(d: ChartRow) => { name: string; value: string }>;
  };
}

/**
 * Config Area chart (@ant-design/plots v2, G2 5) untuk semua chart tren.
 *
 * PENTING: `children` ditulis eksplisit. Default plot Area v2 sudah berisi
 * `children: [{ type: 'area' }]` (fill biru solid #1783FF). Menambah key
 * `area: {...}` TIDAK menimpa default itu - hasilnya dua mark area bertumpuk
 * dan yang solid tetap kelihatan. Karena itu area + line didefinisikan
 * sendiri lewat `children`.
 *
 * - area: `shape: 'smooth'`, fill warna series dengan `fillOpacity` 0.08
 * - line: `shape: 'smooth'`, garis 2px warna series
 * - stack: false (series independen)
 * - grid y putus-putus #ececec, axis tanpa garis
 * - tooltip shared + crosshair vertikal + marker (dot hover)
 */
export function buildTrendConfig({
  data,
  colors,
  height,
  tooltip,
}: TrendChartThemeConfig): Record<string, unknown> {
  const colorOf = new Map<string, string>();
  const seen: string[] = [];
  for (const row of data) {
    if (!colorOf.has(row.series)) {
      colorOf.set(
        row.series,
        colors[seen.length % colors.length] ?? seriesColor(seen.length),
      );
      seen.push(row.series);
    }
  }
  const colorFields = {
    xField: 'dateLabel',
    yField: 'value',
    colorField: 'series',
  };
  return {
    data,
    autoFit: true,
    height,
    children: [
      // Area: kurva halus + fill warna series sangat tipis (bukan solid).
      {
        type: 'area',
        ...colorFields,
        shape: 'smooth',
        stack: false,
        style: {
          fill: (datum: { series?: string }) =>
            colorOf.get(datum.series ?? '') ?? seriesColor(0),
          fillOpacity: 0.08,
        },
      },
      // Garis 2px di atas area - satu-satunya elemen yang pekat.
      {
        type: 'line',
        ...colorFields,
        shape: 'smooth',
        style: { lineWidth: 2 },
      },
    ],
    scale: {
      color: { range: colors },
      y: { nice: true, domainMin: 0 },
    },
    axis: {
      x: {
        title: false,
        labelAutoHide: true,
        labelAutoRotate: false,
        line: false,
        labelFill: '#8c8c8c',
      },
      y: {
        title: false,
        line: false,
        labelFill: '#8c8c8c',
        grid: true,
        gridLineDash: [3, 3],
        gridStroke: '#ececec',
        gridStrokeLineWidth: 1,
      },
    },
    legend: false,
    interaction: {
      tooltip: {
        shared: true,
        crosshairs: { type: 'x', line: true },
        marker: true,
      },
    },
    tooltip,
  };
}
