export type PageRequest = {
  page: number;
  pageSize: number;
};

export type PageResult<T> = PageRequest & {
  items: T[];
  total: number;
};

export function normalizePageResult<T>(
  response: unknown,
  request: PageRequest,
): PageResult<T> {
  const payload =
    response && typeof response === 'object'
      ? (response as {
          count?: number;
          total?: number;
          totalCount?: number;
          next?: string | null;
          results?: unknown;
          items?: unknown;
          data?: unknown;
        })
      : null;
  const collection = Array.isArray(response)
    ? response
    : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
  const hasPaginationMetadata =
    payload?.count !== undefined ||
    payload?.total !== undefined ||
    payload?.totalCount !== undefined ||
    payload?.next !== undefined;
  if (!hasPaginationMetadata) {
    throw new Error(
        'The API response is not paginated; server-side pagination metadata is required.',
    );
  }
  if (collection.length > request.pageSize) {
    throw new Error(
        `The API returned ${collection.length} records for a page size of ${request.pageSize}.`,
    );
  }
  const total = Number(
    payload?.count ?? payload?.total ?? payload?.totalCount ?? collection.length,
  );

  return {
    items: collection as T[],
    total: Number.isFinite(total) ? total : collection.length,
    page: request.page,
    pageSize: request.pageSize,
  };
}
