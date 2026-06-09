/**
 * DTOs comunes reutilizables entre módulos.
 */

/** Filtros estándar para listar entidades (status, creador). */
export interface ListFiltersDto {
  status?: string | string[];
  createdById?: number;
}
