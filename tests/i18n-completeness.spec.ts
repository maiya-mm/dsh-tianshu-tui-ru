/**
 * i18n-полнота: каждая CJK-строка в `src/**` (вне комментариев) имеет ключ в словаре.
 *
 * Ключ = китайская строка-источник (для шаблонов — каждый статический кусок
 * отдельно). Тест падает со списком непереведённых, чтобы дырку было видно
 * без ручного grep.
 *
 * Комментарии не считаются: сканер проходит по коду и пропускает `//` и `/* *\/`.
 * Файлы словаря (`src/i18n/**`) исключены — там китайский ключ по определению.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { RU } from '../src/i18n/ru.js'

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef\u3040-\u30ff]/

interface Unit {
  file: string
  text: string
}

/**
 * Статический текст строковых литералов и кусков шаблонов, содержащих CJK.
 * Регэкспы, комментарии и `${...}` пропускаются: переводится только текст.
 * @param src - исходник TS.
 * @param file - путь (для сообщения об ошибке).
 * @returns найденные куски текста.
 */
function cjkUnits(src: string, file: string): Unit[] {
  const n = src.length
  let i = 0
  const out: Unit[] = []
  const emit = (raw: string): void => {
    // Ключ словаря — рантайм-строка: раскрываем JS-экранирование (\n, \uXXXX).
    let text = raw
    try {
      text = JSON.parse('"' + raw.replace(/\\'/g, "'").replace(/"/g, '\\"') + '"') as string
    } catch {
      text = raw
    }
    if (text.length === 0 || /[\n\r]/.test(text)) return
    if (!CJK.test(text)) return
    out.push({ file, text })
  }
  const skipLine = (): void => {
    while (i < n && src[i] !== '\n') i++
  }
  const skipBlock = (): void => {
    while (i < n) {
      if (src[i] === '*' && src[i + 1] === '/') {
        i += 2
        return
      }
      i++
    }
  }
  const str = (q: string): void => {
    let text = ''
    i++
    while (i < n) {
      const c = src[i]!
      if (c === '\\') {
        text += c + (src[i + 1] ?? '')
        i += 2
        continue
      }
      if (c === q) {
        i++
        break
      }
      text += c
      i++
    }
    emit(text)
  }
  const tpl = (): void => {
    i++
    let text = ''
    while (i < n) {
      const c = src[i]!
      if (c === '\\') {
        text += c + (src[i + 1] ?? '')
        i += 2
        continue
      }
      if (c === '`') {
        emit(text)
        i++
        return
      }
      if (c === '$' && src[i + 1] === '{') {
        emit(text)
        text = ''
        i += 2
        expr()
        continue
      }
      text += c
      i++
    }
    emit(text)
  }
  const expr = (): void => {
    let depth = 1
    while (i < n) {
      const c = src[i]!
      if (c === '/' && src[i + 1] === '/') {
        skipLine()
        continue
      }
      if (c === '/' && src[i + 1] === '*') {
        i += 2
        skipBlock()
        continue
      }
      if (c === "'" || c === '"') {
        str(c)
        continue
      }
      if (c === '`') {
        tpl()
        continue
      }
      if (c === '{') depth++
      if (c === '}') {
        depth--
        i++
        if (depth === 0) return
        continue
      }
      i++
    }
  }
  while (i < n) {
    const c = src[i]!
    if (c === '/' && src[i + 1] === '/') {
      skipLine()
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2
      skipBlock()
      continue
    }
    if (c === "'" || c === '"') {
      str(c)
      continue
    }
    if (c === '`') {
      tpl()
      continue
    }
    i++
  }
  return out
}

function collect(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collect(path))
    else if (path.endsWith('.ts')) files.push(path)
  }
  return files
}

describe('i18n: полнота словаря', () => {
  it('каждая CJK-строка src/** имеет ключ в ru.ts', () => {
    const files = collect('src').filter((f) => !f.startsWith('src/i18n/'))
    const units: Unit[] = []
    for (const file of files) units.push(...cjkUnits(readFileSync(file, 'utf8'), file))
    const missing = units.filter((u) => RU[u.text] === undefined)
    expect(missing.map((u) => `${u.file}: ${JSON.stringify(u.text)}`)).toEqual([])
  })

  it('в словаре нет CJK в значениях', () => {
    const bad = Object.entries(RU).filter(([, value]) => CJK.test(value))
    expect(bad).toEqual([])
  })
})
