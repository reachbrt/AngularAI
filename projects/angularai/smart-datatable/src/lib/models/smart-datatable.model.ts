/**
 * Column definition
 */
export interface ColumnDef {
  /** Column key */
  key: string;
  /** Display header */
  header: string;
  /** Column type */
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'custom';
  /** Is sortable */
  sortable?: boolean;
  /** Is filterable */
  filterable?: boolean;
  /** Width */
  width?: string;
  /** Custom formatter */
  formatter?: (value: any, row: any) => string;
}

/**
 * Sort state
 */
export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter state
 */
export interface FilterState {
  column: string;
  value: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt';
}

/**
 * AI query result
 */
export interface AIQueryResult {
  /** Filtered/sorted data */
  data: any[];
  /** Natural language explanation */
  explanation: string;
  /** Applied filters */
  appliedFilters: FilterState[];
  /** Applied sort */
  appliedSort?: SortState;
}

/**
 * Smart datatable configuration
 */
export interface SmartDatatableConfig {
  /** Enable AI natural language queries */
  aiQueries?: boolean;
  /** Enable AI-powered insights */
  aiInsights?: boolean;
  /** Page size */
  pageSize?: number;
  /** Enable pagination */
  pagination?: boolean;
  /** Enable row selection */
  selectable?: boolean;
  /** Enable export */
  exportable?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_DATATABLE_CONFIG: SmartDatatableConfig = {
  aiQueries: true,
  aiInsights: false,
  pageSize: 10,
  pagination: true,
  selectable: false,
  exportable: true
};

