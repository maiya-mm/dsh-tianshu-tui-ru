/** 启动项种类（回显与 /xxx default 提示共用）。 */
export type StartupKind = 'theme' | 'model' | 'effort' | 'density' | 'preset' | 'vim';
/** 剥末尾 default 标志：`/theme paper default` → rest=paper persist=true。 */
export declare function splitDefaultFlag(text: string): {
    rest: string;
    persist: boolean;
};
/** 仅本会话回显：点名本会话 + 如何写默认。 */
export declare function echoSessionOnly(kind: StartupKind, value: string): string;
/** /effort 选择：auto 清除 reasoningEffort。 */
export declare function effortSelection(base: {
    provider: string;
    model: string;
}, level: string): {
    provider: string;
    model: string;
    reasoningEffort?: string;
};
/** 写启动默认回显：主题说重启，其余说新会话。 */
export declare function echoSavedDefault(kind: StartupKind, value: string): string;
