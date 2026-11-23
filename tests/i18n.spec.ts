/**
 * i18n — 翻译层契约 + 渲染管线接线（宽度计算之前翻译）。
 *
 * 语言优先级：prefs.json lang > env DSH_TUI_LANG > zh（源语言，恒等）。
 * 「接线」用例即验收演示：同一渲染函数在 ru/zh 下分别出俄文/中文。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { currentLanguage, resetLanguageCache, tr } from '../src/i18n/index.js'
import { parsePrefs } from '../src/prefs.js'
import { formatPromptFooter } from '../src/format/prompt-footer.js'
import { formatWelcomeTips } from '../src/format/welcome.js'
import { formatSlashMenu } from '../src/format/slash-menu.js'
import { getTheme } from '../src/theme.js'
import { displayWidth } from '../src/width.js'

// colorLevel 0：chalk 不出 ANSI，断言可直接看字面文本。
const theme = getTheme(0)

const ENV_KEY = 'DSH_TUI_LANG'
const envBefore = process.env[ENV_KEY]

beforeEach(() => {
  resetLanguageCache()
})

afterEach(() => {
  if (envBefore === undefined) delete process.env[ENV_KEY]
  else process.env[ENV_KEY] = envBefore
  resetLanguageCache()
})

describe('tr 基本契约', () => {
  it('ru：返回字典译文', () => {
    process.env[ENV_KEY] = 'ru'
    expect(tr('新会话')).toBe('Новый сеанс')
  })

  it('zh：恒等（源串原样）', () => {
    process.env[ENV_KEY] = 'zh'
    expect(tr('新会话')).toBe('新会话')
  })

  it('缺省（无 env / 无 prefs）：zh 恒等', () => {
    delete process.env[ENV_KEY]
    expect(currentLanguage()).toBe('zh')
    expect(tr('新会话')).toBe('新会话')
  })

  it('ru 下字典缺 key：回落源串', () => {
    process.env[ENV_KEY] = 'ru'
    expect(tr('这条不在字典里')).toBe('这条不在字典里')
  })

  it('非法 env 值：回落 zh', () => {
    process.env[ENV_KEY] = 'klingon'
    expect(currentLanguage()).toBe('zh')
  })
})

describe('prefs.lang 白名单', () => {
  it('接受 zh/ru/en，其余丢弃', () => {
    expect(parsePrefs(JSON.stringify({ lang: 'ru' })).lang).toBe('ru')
    expect(parsePrefs(JSON.stringify({ lang: 'zh' })).lang).toBe('zh')
    expect(parsePrefs(JSON.stringify({ lang: 'klingon' })).lang).toBeUndefined()
  })
})

describe('渲染管线接线（宽度计算前翻译）', () => {
  it('footer 轮播提示：ru 出俄文，zh 出中文', () => {
    process.env[ENV_KEY] = 'ru'
    const ru = formatPromptFooter({ width: 120, tipIndex: 0 }, theme).join('\n')
    expect(ru).toContain('/ команды · ctrl+p панель')

    process.env[ENV_KEY] = 'zh'
    const zh = formatPromptFooter({ width: 120, tipIndex: 0 }, theme).join('\n')
    expect(zh).toContain('/ 命令 · ctrl+p 面板')
  })

  it('footer 审批提示保留段首键位 token（中间档/丢段查表依赖它）', () => {
    process.env[ENV_KEY] = 'ru'
    const out = formatPromptFooter({ width: 200, approvalPending: true }, theme).join('\n')
    expect(out).toContain('y разрешить')
    expect(out).toContain('esc отмена')
  })

  it('欢迎页 tips：ru 出俄文且每行宽度 ≤ width', () => {
    process.env[ENV_KEY] = 'ru'
    const lines = formatWelcomeTips({ width: 60, items: [{ keyHint: 'ctrl+n', label: '新会话' }] }, theme)
    expect(lines.join('\n')).toContain('Новый сеанс')
    expect(lines.every(line => displayWidth(line) <= 60)).toBe(true)
  })

  it('slash 菜单描述：ru 出俄文，zh 出中文', () => {
    const items = [{ name: 'exit', description: '退出 TUI（与 Ctrl+Q 相同）' }]
    process.env[ENV_KEY] = 'ru'
    expect(formatSlashMenu({ width: 120, items, selected: 0 }, theme).join('\n')).toContain('Выйти из TUI')
    process.env[ENV_KEY] = 'zh'
    expect(formatSlashMenu({ width: 120, items, selected: 0 }, theme).join('\n')).toContain('退出 TUI')
  })
})
