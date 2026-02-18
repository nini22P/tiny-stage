export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
} as const

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export class Logger {
  private static _level: LogLevel = LogLevel.WARN
  private static _prefix = '[Tiny Stage]'

  static setLevel(level: LogLevel): void {
    this._level = level
  }

  static get level(): LogLevel {
    return this._level
  }

  static set prefix(prefix: string) {
    this._prefix = prefix
  }

  static get prefix(): string {
    return this._prefix
  }

  static getLevel(): LogLevel {
    return this.level
  }


  static setPrefix(prefix: string): void {
    this.prefix = prefix
  }

  static debug(...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.prefix, ...args)
    }
  }

  static info(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.prefix, ...args)
    }
  }

  static warn(...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.prefix, ...args)
    }
  }

  static error(...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.prefix, ...args)
    }
  }
}

