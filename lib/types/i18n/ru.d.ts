/**
 * 俄语字典 — key = 源码里的中文原文，value = 俄文技术文案。
 *
 * seed 范围（首个无 provider 屏幕）：欢迎頁 tips、footer 轮播/审批/检查提示、
 * slash 命令描述核心项。全量翻译是下一任务，不在此扩散。
 *
 * 审批提示段的译文**必须保留段首键位 token**（`y `、`esc ` 等）：footer 的
 * 中间档降级与丢段次序按首个空白前的 token 查表（见 format/prompt-footer.ts）。
 *
 * @module @deepseek-ai/dsh-tianshu-tui/i18n/ru
 */
/** zh 源串 → ru 译文（缺 key → 渲染层回落源串）。 */
export declare const RU: Readonly<Record<string, string>>;
