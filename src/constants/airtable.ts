/**
 * Airtable 领域常量
 *
 * 注意：不要用 UI/动画常量来充当业务数值。
 * 这里的数值是业务语义：查询上限、统计窗口等。
 */

// Airtable list/select 的合理上限（避免一次拉取过多导致超时）
export const AIRTABLE_STATS_MAX_RECORDS = 1000 as const;
