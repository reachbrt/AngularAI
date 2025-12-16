// ============ Column Types ============
export type ColumnType = 'string' | 'text' | 'number' | 'date' | 'boolean' | 'currency';
export type ColumnAlign = 'left' | 'center' | 'right';

/**
 * Column definition
 */
export interface Column<T = any> {
  /** Data property key (required) */
  key: string;
  /** Display label */
  label?: string;
  /** Legacy alias for label */
  header?: string;
  /** Column type for sorting/filtering */
  type?: ColumnType;
  /** Is sortable */
  sortable?: boolean;
  /** Is filterable */
  filterable?: boolean;
  /** Show/hide column */
  visible?: boolean;
  /** Column width */
  width?: string | number;
  /** Text alignment */
  align?: ColumnAlign;
  /** Custom value formatter */
  formatter?: (value: any, row: T) => string;
  /** Sample values for AI context */
  examples?: any[];
}

/** @deprecated Use Column instead */
export type ColumnDef = Column;

// ============ Filter Types ============
export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'regex' | 'startsWith' | 'endsWith';
export type LogicalOperator = 'AND' | 'OR';

/**
 * Filter condition
 */
export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter definition with multiple conditions
 */
export interface FilterDefinition {
  conditions: FilterCondition[];
  operator: LogicalOperator;
}

/**
 * Sort definition
 */
export interface SortDefinition {
  column: string;
  order: 'asc' | 'desc';
}

/** @deprecated Use SortDefinition instead */
export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

/** @deprecated Use FilterCondition instead */
export interface FilterState {
  column: string;
  value: string;
  operator: FilterOperator;
}

// ============ AI Types ============
/**
 * AI search result
 */
export interface AISearchResult<T = any> {
  query: string;
  filter?: FilterDefinition;
  sort?: SortDefinition;
  explanation: string;
  results?: T[];
}

/** @deprecated Use AISearchResult instead */
export interface AIQueryResult {
  data: any[];
  explanation: string;
  appliedFilters: FilterState[];
  appliedSort?: SortState;
}

/**
 * Insight category types
 */
export type InsightCategory = 'trends' | 'outliers' | 'patterns' | 'recommendations' | 'summary' | 'predictions';

/**
 * AI-generated insight
 */
export interface AIInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  confidence: number;
  data?: any;
  actions?: Array<{ label: string; handler: () => void }>;
}

/**
 * Row agent for AI-powered row operations
 */
export interface RowAgent {
  id: string;
  label: string;
  icon?: string;
  promptTemplate: string;
  scope?: 'single' | 'multi';
  handler?: (row: any, result: string) => void;
}

/**
 * Result of row agent execution
 */
export interface AgentResult {
  agentId: string;
  rowId: any;
  result: string;
  timestamp: Date;
}

/**
 * Chat message for natural language filtering
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  filterApplied?: boolean;
  resultCount?: number;
}

// ============ Transformation Types ============

/**
 * AI transformation definition
 */
export interface AITransformation {
  id: string;
  label: string;
  scope: 'column' | 'row' | 'selection' | 'table';
  targetColumn?: string;
  promptTemplate: string;
  preview?: boolean;
  handler?: (changes: TransformationChange[]) => void;
}

/**
 * Single transformation change
 */
export interface TransformationChange {
  rowIndex: number;
  column: string;
  oldValue: any;
  newValue: any;
}

/**
 * Result of transformation operation
 */
export interface TransformationResult {
  transformationId: string;
  changes: TransformationChange[];
  affectedRows: number;
  preview?: boolean;
}

// ============ Action Types ============
export type ActionVariant = 'primary' | 'danger' | 'secondary';

/**
 * Custom row action
 */
export interface Action {
  label: string;
  icon?: string;
  handler: (row: any) => void;
  condition?: (row: any) => boolean;
  variant?: ActionVariant;
}

// ============ Schema Types ============
/**
 * Column schema for AI context
 */
export interface TableSchemaColumn {
  key: string;
  type: ColumnType;
  label: string;
  examples?: any[];
}

/**
 * Table schema for AI operations
 */
export interface TableSchema {
  columns: TableSchemaColumn[];
  rowCount: number;
  sampleRows: any[];
}

/**
 * Smart datatable configuration
 */
export interface SmartDatatableConfig {
  /** Enable AI natural language queries */
  aiSearch?: boolean;
  /** Legacy alias */
  aiQueries?: boolean;
  /** Enable AI-powered insights */
  aiInsights?: boolean;
  /** Page size */
  pageSize?: number;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Enable pagination */
  pagination?: boolean;
  /** Enable row selection */
  selectable?: boolean;
  /** Enable export */
  exportable?: boolean;
  /** Theme */
  theme?: 'light' | 'dark';
  /** Row key identifier */
  rowKey?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_DATATABLE_CONFIG: SmartDatatableConfig = {
  aiSearch: true,
  aiQueries: true,
  aiInsights: false,
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  pagination: true,
  selectable: false,
  exportable: true,
  theme: 'light',
  rowKey: 'id'
};
