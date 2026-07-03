/**
 * 测试相关的TypeScript类型定义
 * 用于替换测试文件中的any类型，提升类型安全性
 */

// ============================================================================
// Airtable Test Types - 用于 Airtable 服务测试的类型
// ============================================================================

export interface AirtableRecordLike<Fields = Record<string, unknown>> {
  id: string;
  fields: Fields;
  createdTime?: string;
}

export interface AirtableTableLike<Fields = Record<string, unknown>> {
  create: (
    records: Array<{ fields: Fields }> | { fields: Fields },
  ) => Promise<AirtableRecordLike<Fields>[]>;
  select: (_params?: Record<string, unknown>) => {
    all: () => Promise<AirtableRecordLike<Fields>[]>;
    firstPage?: () => Promise<AirtableRecordLike<Fields>[]>;
  };
  update: (
    records:
      | Array<{ id: string; fields: Partial<Fields> }>
      | {
          id: string;
          fields: Partial<Fields>;
        },
  ) => Promise<AirtableRecordLike<Fields>[]>;
  destroy: (ids: string[]) => Promise<Array<{ id: string; deleted: boolean }>>;
}

export interface AirtableBaseLike<Fields = Record<string, unknown>> {
  table: (_name: string) => AirtableTableLike<Fields>;
}

export interface AirtableServicePrivate<Fields = Record<string, unknown>> {
  base?: AirtableBaseLike<Fields> | null;
  isConfigured: boolean;
  configuration?: {
    apiKey?: string;
    baseId?: string;
    tableName?: string;
  } | null;
}

export interface DynamicImportModule {
  [exportName: string]: unknown;
}
