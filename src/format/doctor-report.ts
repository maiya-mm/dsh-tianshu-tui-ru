/**
 * 终端诊断报告（format/doctor-report.ts）— 纯函数。
 *
 * /doctor 命令的数据聚合层：收集终端环境检测结果，输出可读报告行。
 * 所有检测函数引用既有导出（theme-detect / ansi / term-caps），不新增检测逻辑。
 */
import { color } from '../engine/ansi.js'
import { detectHyperlinkSupport, detectImageProtocol } from '../engine/ansi.js'
import { isLegacyWindowsConsole } from '../term-caps.js'
import type { RivetTheme } from '../theme.js'

import { tr } from '../i18n/index.js'
/** 单条诊断检查结果。 */
export interface DoctorCheck {
  name: string
  status: 'ok' | 'warn' | 'info'
  value: string
  fixId?: number
}

/** 可修复项的修复指引。 */
export interface DoctorFix {
  id: number
  title: string
  guidance: string
}

/**
 * 收集终端诊断报告。
 * @param cols 终端列数
 * @param rows 终端行数
 * @param background 终端背景色
 * @param env 环境变量（默认 process.env）
 * @returns 检查结果列表（可修复项带 fixId）。
 */
export function collectDoctorReport(
  cols: number,
  rows: number,
  background: string,
  env: NodeJS.ProcessEnv = process.env,
): DoctorCheck[] {
  const checks: DoctorCheck[] = [
    { name: tr('终端尺寸'), status: 'ok', value: `${cols}×${rows}` },
    { name: tr('终端背景'), status: 'ok', value: background },
  ]

  // 超链接支持
  const hyperlink = detectHyperlinkSupport(env)
  checks.push({ name: tr('超链接'), status: hyperlink ? 'ok' : 'warn', value: hyperlink ? '✓' : tr('不支持') })

  // 图片协议
  const imageProtocol = detectImageProtocol(env)
  checks.push({ name: tr('图片协议'), status: imageProtocol !== 'none' ? 'ok' : 'info', value: imageProtocol })

  // 遗留终端
  const legacy = isLegacyWindowsConsole(env)
  checks.push({ name: tr('终端兼容'), status: legacy ? 'warn' : 'ok', value: legacy ? tr('遗留模式（功能受限）') : tr('现代终端') })

  // True Color（chalk.level: 0=none,1=16,2=256,3=16m）
  const tcLevel = (globalThis as Record<string, unknown>).chalkLevel as number | undefined ?? 3
  checks.push({ name: 'True Color', status: tcLevel >= 3 ? 'ok' : 'warn', value: tcLevel >= 3 ? tr('✓ 16M 色') : `${tr('仅 ')}${tcLevel === 2 ? tr('256 色') : tr('16 色')}` })

  // tmux 剪贴板
  const inTmux = Boolean(env.TMUX)
  checks.push({
    name: tr('剪贴板'), status: inTmux ? 'warn' : 'ok',
    value: inTmux ? tr('tmux 内（需 set-clipboard on）') : tr('直接终端'),
    ...(inTmux ? { fixId: 1 } : {}),
  })

  // kitty dcs-passthrough
  const term = (env.TERM ?? '').toLowerCase()
  const isKitty = term.includes('kitty')
  if (isKitty && imageProtocol === 'none') {
    checks.push({
      name: tr('kitty 图片'), status: 'warn',
      value: tr('dcs-passthrough 未开启'),
      fixId: 2,
    })
  }

  return checks
}

/** 可修复项清单（与 DoctorCheck.fixId 对应）。 */
export const DOCTOR_FIXES: DoctorFix[] = [
  {
    id: 1,
    title: tr('tmux 剪贴板配置'),
    guidance: tr("echo 'set-option -s set-clipboard on' >> ~/.tmux.conf  # 允许 tmux 使用系统剪贴板"),
  },
  {
    id: 2,
    title: 'kitty dcs-passthrough',
    guidance: tr("echo 'term_features all' >> ~/.config/kitty/kitty.conf  # 启用 DCS 透传（图片协议需要）"),
  },
]

/**
 * 渲染诊断报告为终端行。
 * @param checks - collectDoctorReport 的检查结果。
 * @param theme - 当前主题（状态图标与文字分色）。
 * @returns ANSI 行数组：标题 + 逐项检查 + 可修复项汇总（如有）。
 */
export function renderDoctorReport(checks: DoctorCheck[], theme: RivetTheme): string[] {
  const lines: string[] = []
  lines.push(color(tr('终端诊断报告:'), theme.brandColor))

  for (const check of checks) {
    const icon = check.status === 'ok'
      ? color(' ✓ ', theme.primary)
      : check.status === 'warn'
        ? color(' ⚠ ', theme.secondary)
        : color(' ℹ ', theme.muted)
    const fixTag = check.fixId !== undefined ? color(`${tr(' [修复 ')}${check.fixId}]`, theme.muted) : ''
    lines.push(`${icon}${check.name}: ${color(check.value, theme.muted)}${fixTag}`)
  }

  // 可修复项汇总
  const fixable = checks.filter(c => c.fixId !== undefined)
  if (fixable.length > 0) {
    lines.push('')
    lines.push(color(tr('可修复项:'), theme.brandColor))
    for (const check of fixable) {
      const fix = DOCTOR_FIXES.find(f => f.id === check.fixId)
      if (fix !== undefined) {
        lines.push(`  [${fix.id}] ${fix.title}`)
      }
    }
    lines.push(color(tr('运行 /doctor fix <id> 查看修复指引'), theme.muted))
  }

  return lines
}

/**
 * 获取修复指引文本。
 * @param fixId - 修复项 id（DoctorCheck.fixId）。
 * @returns 标题 + 指引文本；未知 id 返回 null。
 */
export function getDoctorFixGuidance(fixId: number): string | null {
  const fix = DOCTOR_FIXES.find(f => f.id === fixId)
  if (fix === undefined) return null
  return `[${fix.id}] ${fix.title}\n\n${fix.guidance}`
}
