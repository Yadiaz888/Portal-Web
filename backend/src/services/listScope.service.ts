import { ListFiltersDto } from '../dto/common.dto.js';
import { AuthenticatedRequest, ListFiltersQuery } from '../types/request.types.js';

const ACCOUNTANT_QUEUE = ['APPROVED_MANAGER', 'APPROVED_ACCOUNTANT'];

function normalizeStatus(status?: string) {
  return status?.split(',').map((item) => item.trim()).filter(Boolean);
}

function intersectStatuses(requested: string[] | undefined, allowed: string[]) {
  if (!requested || requested.length === 0) return allowed;
  return requested.filter((status) => allowed.includes(status));
}

export function buildScopedListFilters(
  request: AuthenticatedRequest,
  query: ListFiltersQuery
): ListFiltersDto {
  const requestedStatuses = normalizeStatus(query.status);
  const filters: ListFiltersDto = {
    status: requestedStatuses && requestedStatuses.length === 1 ? requestedStatuses[0] : requestedStatuses,
    createdById: query.createdById ? Number(query.createdById) : undefined,
  };

  const roleName = request.user.role?.name;

  if (roleName === 'ADMIN') {
    return filters;
  }

  if (roleName === 'MANAGER') {
    filters.status = intersectStatuses(requestedStatuses, ['PENDING']);
    filters.createdById = undefined;
    return filters;
  }

  if (roleName === 'ACCOUNTANT') {
    filters.status = intersectStatuses(requestedStatuses, ACCOUNTANT_QUEUE);
    filters.createdById = undefined;
    return filters;
  }

  filters.createdById = request.user.id;
  return filters;
}
