/** 语义 token 集。值是 hex（truecolor 轨）或 chalk 命名色（fallback 轨）。 */
export interface ColorSet {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    dim: string;
    pulseQuiet: string;
    pulseActive: string;
    pulseAlert: string;
    /** bash/grep/glob 工具色，默认回退到 primary */
    toolShell?: string;
    /** edit_file/write_file 工具色，默认回退到 secondary */
    toolEdit?: string;
    /** run_tests 工具色，默认回退到 success */
    toolTest?: string;
    /** delegate_task/delegate_batch 工具色，默认回退到 warning */
    toolDelegate?: string;
}
/** buildTheme 的 overrides 形参（userColor 等非 ColorSet token）。 */
export interface ThemeOverrides {
    userColor?: string;
    assistantColor?: string;
    muted?: string;
    systemColor?: string;
    /** 品牌词专用色（「天枢」字样、品牌星 ✦）。缺省 = primary。
     *  独立于 userColor：品牌色跟品牌走，不随「用户消息」语义色漂移。 */
    brandColor?: string;
}
/** 一套主题的完整定义：truecolor/fallback 双轨 ColorSet、双轨 overrides、背景朝向与 picker 描述。 */
export interface ThemePaletteDef {
    truecolor: ColorSet;
    fallback: ColorSet;
    /** truecolor 轨的 overrides */
    overrides?: ThemeOverrides;
    /** fallback 轨的 overrides */
    fallbackOverrides?: ThemeOverrides;
    /** 面向的终端背景。auto 检测后按此选择默认主题。 */
    background: 'dark' | 'light';
    /** /theme picker 描述文案。 */
    description: string;
}
/** 全部内置主题调色板（名字 → 定义）；消费方经 theme.ts 的 buildTheme/THEMES 使用。 */
export declare const THEME_PALETTES: {
    readonly pastel: ThemePaletteDef;
    readonly cyberpunk: ThemePaletteDef;
    readonly observatory: ThemePaletteDef;
    readonly midnight: ThemePaletteDef;
    readonly starfield: ThemePaletteDef;
    readonly tianshu: ThemePaletteDef;
    readonly claude: ThemePaletteDef;
    readonly ziwei: ThemePaletteDef;
    readonly slate: ThemePaletteDef;
    readonly dawn: ThemePaletteDef;
    readonly antigravity: ThemePaletteDef;
    readonly cobalt: ThemePaletteDef;
    readonly graphite: ThemePaletteDef;
    readonly gemini: ThemePaletteDef;
    readonly paper: ThemePaletteDef;
    readonly 'light-ansi': ThemePaletteDef;
};
/** 内置主题名（THEME_PALETTES 的键）。 */
export type ThemeName = keyof typeof THEME_PALETTES;
