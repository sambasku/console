import {
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  tableFeatures,
} from '@tanstack/react-table';

/**
 * Feature set TanStack Table v9 untuk seluruh tabel admin.
 *
 * v9 menaikkan harga API: `useTable` wajib menerima `features` (daftar
 * feature + row model + registry fn) supaya bundling bisa tree-shake. Fitur
 * yang dipakai aplikasi kita:
 * - `columnSizingFeature` -> `size` per kolom (dipakai bridge `DataTable`
 *   untuk translate ke `width` antd).
 * - `columnVisibilityFeature` -> `column.getIsVisible()` di bridge.
 * - `rowPaginationFeature` -> `manualPagination` (server-side paging).
 *
 * `coreRowModel` tidak perlu dipasang: v9 memakai `createCoreRowModel()`
 * bawaan saat slot itu kosong.
 *
 * ponytail: kalau nanti butuh sorting/filtering client-side, tambahkan
 * `rowSortingFeature` + `createSortedRowModel()` di sini, bukan bikin
 * features per halaman.
 */
export const tableFeatureSet = tableFeatures({
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
});
