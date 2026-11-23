/**
 * i18n 基础层 — 单点翻译函数 tr()。翻译是**数据**（`ru.ts` 字典），
 * 渲染管线只在算宽度之前调用 tr，源串（中文）保持不变。
 *
 * 语言选择优先级：prefs.json `lang` > env `DSH_TUI_LANG` > 'zh'。
 * `zh` 下 tr 是恒等函数（现行为零风险）；字典缺 key 时原样返回源串。
 *
 * 约束：tr 必须在 displayWidth/truncateTo/换行等宽度计算**之前**调用——
 * 俄文通常比中文宽，翻译后再测量才不会破版（对齐见 format 层）。
 *
 * @module @deepseek-ai/dsh-tianshu-tui/i18n
 */

import { prefsEnabled, readPrefs, TUI_LANGUAGES, type TuiLanguage } from '../prefs.js'
import { RU } from './ru.js'

/** 已接入的字典（zh = 源语言，无字典；en 暂空，未创建）。 */
const DICTS: Readonly<Partial<Record<TuiLanguage, Readonly<Record<string, string>>>>> = {
  ru: RU,
}

/** prefs 语言缓存（文件读一次；env 每次读——测试按需切 env 即可）。 */
let prefsLangCache: { value: TuiLanguage | undefined } | null = null

function normalizeLang(value: string | undefined): TuiLanguage | undefined {
  return value !== undefined && (TUI_LANGUAGES as readonly string[]).includes(value)
    ? (value as TuiLanguage)
    : undefined
}

/** prefs.json 的 lang（VITEST 密封门下读不到 → undefined，对齐 prefs 先例）。 */
function prefsFileLang(): TuiLanguage | undefined {
  if (prefsLangCache === null) {
    const path = prefsEnabled(undefined)
    prefsLangCache = { value: path === null ? undefined : readPrefs(path).lang }
  }
  return prefsLangCache.value
}

/** 当前生效语言（prefs > env > 缺省 zh）。 */
export function currentLanguage(): TuiLanguage {
  return prefsFileLang() ?? normalizeLang(process.env.DSH_TUI_LANG) ?? 'zh'
}

/**
 * 翻译一条 UI 源串（key = 源码里的中文原文）。
 * @param s - 源串；字典无此 key 或语言为 zh 时原样返回。
 * @returns 译文（当前语言）或源串。
 */
export function tr(s: string): string {
  const lang = currentLanguage()
  if (lang === 'zh') return s
  return DICTS[lang]?.[s] ?? s
}

/** 测试钩子：丢弃 prefs 语言缓存（模拟进程重启后重读 prefs.json）。 */
export function resetLanguageCache(): void {
  prefsLangCache = null
}
