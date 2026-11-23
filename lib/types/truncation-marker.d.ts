/**
 * 折叠 N 行的提示：`… +25 行`（纯计数，不带展开快捷键——ctrl+o 已被占用且无消费端）。
 * @param omitted - 被折叠的行/项数。
 * @param unit - 计数单位（缺省「行」；diff 场景可传「行 diff」等）。
 * @returns 截断计数提示行。
 */
export declare function truncationHint(omitted: number, unit?: string): string;
/**
 * 截断标记识别。生产端形态统一锚 `… +N 行` 计数，展开提示可选（兼容
 * /resume 载入旧会话里的 `… +25 行 · ctrl+o 展开` 与历史英文
 * `… +N lines [Ctrl+O]`，不认会让旧会话的展开入口失效）。
 */
export declare const TRUNCATION_MARKER_RE: RegExp;
