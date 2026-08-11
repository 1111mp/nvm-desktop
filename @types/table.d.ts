import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TFeatures, TData extends RowData, TValue> {
    label?: string;
    className?: string;
  }
}
