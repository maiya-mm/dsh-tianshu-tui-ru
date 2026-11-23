/**
 * i18n-рендер: под `ru` на экранах нет CJK; под `zh` китайский остаётся.
 *
 * Экраны выбраны так, чтобы покрыть разные слои швов:
 * - редактор провайдера (поле модели без id → «не заполнено») — цвет/трункация;
 * - палитра команд — заголовки групп (перевод в color() по точной строке);
 * - /doctor — таблица проверок и подсказки починки;
 * - диалог API-ключа — деградация без хранилища ключей;
 * - welcome-tips — подписи до расчёта ширины.
 *
 * `zh` — identity: те же экраны остаются китайскими (регресс-замок).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLanguageCache } from '../src/i18n/index.js'
import type { RivetTheme } from '../src/theme.js'

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef\u3040-\u30ff]/
const ENV_KEY = 'DSH_TUI_LANG'
const envBefore = process.env[ENV_KEY]

function fakeTheme(): RivetTheme {
  return {
    primary: '#111111',
    secondary: '#222222',
    success: '#333333',
    warning: '#444444',
    error: '#555555',
    dim: '#666666',
    muted: '#777777',
    pulseQuiet: '#888888',
    pulseActive: '#999999',
    pulseAlert: '#aaaaaa',
    userColor: '#bbbbbb',
    assistantColor: '#cccccc',
    systemColor: '#dddddd',
    brandColor: '#eeeeee',
    toolColor: () => '#000000',
    contextColor: () => '#000000',
  }
}

const ansi = /\u001b\[[0-9;]*m/g
/** CJK-строки экрана (ANSI снят, чтобы не мешал). */
function cjkLines(lines: readonly string[]): string[] {
  return lines.map((l) => l.replace(ansi, '')).filter((l) => CJK.test(l))
}

async function providerEditorScreen(): Promise<string[]> {
  const { ProviderEditorController } = await import('../src/ui/provider-editor.js')
  const editor = new ProviderEditorController({ getTheme: fakeTheme })
  editor.open({
    mode: 'create',
    title: '新增自定义 pi-ai 供应商',
    draft: {
      route: 'acme',
      declared: true,
      profile: { api: 'openai-completions', baseURL: 'http://127.0.0.1:8317/v1' },
      models: [{ id: '' }],
      modelsOverridden: true,
      keyDraft: '',
    },
    taken: [],
    discover: vi.fn(async () => []),
    save: vi.fn(async () => ({ kind: 'saved' as const })),
  })
  return editor.render(100, 30)
}

async function paletteScreen(): Promise<string[]> {
  const { emptyPaletteState, renderCommandPalette } = await import('../src/command-palette.js')
  return renderCommandPalette(
    emptyPaletteState(),
    [
      { name: 'help', description: 'Список команд', group: '会话' },
      { name: 'model', description: 'Модель', group: '配置' },
      { name: 'skill', description: 'Скиллы', group: '技能' },
    ],
    80,
    20,
    fakeTheme(),
  )
}

async function doctorScreen(): Promise<string[]> {
  const { collectDoctorReport, renderDoctorReport, getDoctorFixGuidance } = await import('../src/format/doctor-report.js')
  const checks = collectDoctorReport(80, 24, '#000000', {})
  return [...renderDoctorReport(checks, fakeTheme()), getDoctorFixGuidance(1) ?? '', getDoctorFixGuidance(2) ?? '']
}

async function keyDialogScreen(): Promise<string[]> {
  const { KeyDialogController } = await import('../src/ui/key-dialog.js')
  const dialog = new KeyDialogController({ getTheme: fakeTheme })
  await dialog.open(undefined)
  return dialog.render(80, 20)
}

async function welcomeTipsScreen(): Promise<string[]> {
  const { formatWelcomeTips } = await import('../src/format/welcome.js')
  return formatWelcomeTips(
    {
      width: 60,
      items: [
        { keyHint: '/key', label: '配置 API key' },
        { keyHint: '/help', label: '命令帮助面板' },
      ],
    },
    fakeTheme(),
  )
}

beforeEach(() => {
  resetLanguageCache()
})

afterEach(() => {
  if (envBefore === undefined) delete process.env[ENV_KEY]
  else process.env[ENV_KEY] = envBefore
  resetLanguageCache()
})

describe('ru: экраны без CJK', () => {
  const screens: Array<[string, () => Promise<string[]>]> = [
    ['редактор провайдера', providerEditorScreen],
    ['палитра команд', paletteScreen],
    ['/doctor', doctorScreen],
    ['диалог ключа', keyDialogScreen],
    ['welcome tips', welcomeTipsScreen],
  ]

  for (const [name, screen] of screens) {
    it(`${name}: ни одной китайской строки`, async () => {
      process.env[ENV_KEY] = 'ru'
      const lines = await screen()
      expect(lines.length, `${name}: пустой экран`).toBeGreaterThan(0)
      expect(cjkLines(lines)).toEqual([])
    })
  }

  it('редактор провайдера: модель без id — «не заполнено»', async () => {
    process.env[ENV_KEY] = 'ru'
    const screen = (await providerEditorScreen()).join('\n').replace(ansi, '')
    expect(screen).toContain('не заполнено')
  })
})

describe('zh: китайский остаётся (identity)', () => {
  const screens: Array<[string, () => Promise<string[]>]> = [
    ['редактор провайдера', providerEditorScreen],
    ['палитра команд', paletteScreen],
    ['/doctor', doctorScreen],
  ]

  for (const [name, screen] of screens) {
    it(`${name}: CJK на месте`, async () => {
      process.env[ENV_KEY] = 'zh'
      expect(cjkLines(await screen()).length).toBeGreaterThan(0)
    })
  }
})
