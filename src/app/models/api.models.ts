export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};
