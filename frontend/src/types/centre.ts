export interface DiagnosticTest {
  id: number;
  name: string;
  description: string;
  price: string;
  is_active: boolean;
  centre: number;
}

export interface DiagnosticCentre {
  id: number;
  name: string;
  location: string;
  address: string;
  phone: string;
  is_active: boolean;
  test_count?: number;
  tests?: DiagnosticTest[];
  created_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CentreFilterParams {
  location?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface TestFilterParams {
  centre?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}
