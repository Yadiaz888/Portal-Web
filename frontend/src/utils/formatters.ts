export const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('es-CO')}`;

export const formatDate = (dateStr: string): string => dateStr;
