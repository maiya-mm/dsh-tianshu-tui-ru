/**
 * i18n покрытие — ru-экраны не содержат CJK.
 *
 * Проверяем три вещи:
 * 1. Словарь RU: ни одного CJK-символа в значениях (нет «полупереводов»).
 * 2. Экран провайдера (render + field-строки) под ru → без CJK.
 * 3. Activity-подписи (спиннер/строка активности) под ru → без CJK.
 * 4. zh остаётся identity: экран провайдера под zh — с CJK (регресс-замок).
 *
 * Границы: проверяются экраны, у которых есть чистый рендерер без IO.
 * Остальные (TuiApp-панели, doctor/config) требуют сборки сервисов — в отчёте.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLanguageCache } from '../src/i18n/index.js'
import { RU } from '../src/i18n/ru.js'
import { ProviderEditorController, type ProviderEditorSession } from '../src/ui/provider-editor.js'
import { activityPhrase } from '../src/format/activity-labels.js'
import type { RivetTheme } from '../src/theme.js'

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef\u3040-\u30ff]/
const ENV_KEY = 'DSH_TUI_LANG'
const envBefore = process.env[ENV_KEY]

function fakeTheme(): RivetTheme {
  return {
    primary: '#111111', secondary: '#222222', success: '#333333', warning: '#444444', error: '#555555',
    dim: '#666666', muted: '#777777', pulseQuiet: '#888888', pulseActive: '#999999', pulseAlert: '#aaaaaa',
    userColor: '#bbbbbb', assistantColor: '#cccccc', systemColor: '#dddddd', brandColor: '#eeeeee',
    toolColor: () => '#000000', contextColor: () => '#000000',
  }
}

function makeSession(): ProviderEditorSession {
  return {
    mode: 'create',
    title: '新增自定义 pi-ai 供应商',
    draft: {
      route: 'acme',
      declared: true,
      profile: { api: 'openai-completions', baseURL: 'http://127.0.0.1:8317/v1' },
      models: [{ id: 'm' }],
      modelsOverridden: true,
      keyDraft: '',
    },
    taken: [],
    discover: vi.fn(async () => []),
    save: vi.fn(async () => ({ kind: 'saved' as const })),
  }
}

function providerScreen(): string {
  const editor = new ProviderEditorController({ getTheme: fakeTheme })
  editor.open(makeSession())
  return editor.render(100, 30).join('\n')
}

beforeEach(() => {
  resetLanguageCache()
})

afterEach(() => {
  if (envBefore === undefined) delete process.env[ENV_KEY]
  else process.env[ENV_KEY] = envBefore
  resetLanguageCache()
})

describe('ru: покрытие без CJK', () => {
  it('в словаре нет CJK в значениях', () => {
    const bad = Object.entries(RU).filter(([, value]) => CJK.test(value))
    expect(bad).toEqual([])
  })

  it('экран провайдера (create) под ru без CJK', () => {
    process.env[ENV_KEY] = 'ru'
    const screen = providerScreen()
    const leftover = screen.split('\n').filter(line => CJK.test(line))
    expect(leftover).toEqual([])
    expect(screen).toContain('Найти модели')
    expect(screen).toContain('Сохранить')
    expect(screen).toContain('шт. (свои)')
  })

  it('activity-подписи под ru без CJK', () => {
    process.env[ENV_KEY] = 'ru'
    const kinds = ['thinking', 'tool_use', 'tool_result', 'lifecycle', 'text'] as const
    for (const kind of kinds) {
      const phrase = activityPhrase({ kind, seq: 0, detail: 'shell' })
      expect(CJK.test(phrase), `${kind}: ${phrase}`).toBe(false)
    }
  })

  it('zh остаётся identity (экран провайдера по-прежнему китайский)', () => {
    process.env[ENV_KEY] = 'zh'
    expect(CJK.test(providerScreen())).toBe(true)
  })
})
