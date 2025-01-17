import type { Plugin } from 'vite'
import type { UserOptions } from './lib/options'
import { loadEnv, loadDynamicInjectedEnv } from './lib/env'
import { name } from '../package.json'
import path from 'path'

export function envCompatible(userOptions: UserOptions = {}): Plugin {
  const options: UserOptions = {
    mountedPath: 'process.env',
    ...userOptions,
  }
  return {
    name,
    enforce: 'pre',
    config(config, { mode }) {
      const root = config.root || process.cwd()
      let envDir = config.envDir || './'
      if (!path.isAbsolute(envDir || '')) {
        envDir = path.join(root, envDir)
      }
      const prefix = typeof options.prefix === 'undefined' ? 'VUE_APP_' : options.prefix
      const env = loadEnv({
        mode,
        envDir,
        prefix,
        ignoreProcessEnv: options.ignoreProcessEnv ?? false,
      })
      const dynamicInjectedEnv = loadDynamicInjectedEnv(prefix)
      const myDefine: Record<string, string> = {}
      if (options.mountedPath?.startsWith('process.env')) {
        myDefine['process.env.VITE'] = JSON.stringify(true)
      }
      Object.keys({ ...env, ...dynamicInjectedEnv }).map((key) => {
        const value = env[key]

        /**
         * const a = "'development'"
         * const b = '"development"'
         * const c = 'development'
         * const ret1 = JSON.stringify(a)
         * const ret2 = JSON.stringify(b)
         * const ret3 = JSON.stringify(c)
         * console.log(JSON.stringify(ret1).startsWith(`"`)) // true
         * console.log(JSON.stringify(ret2).startsWith(`"`)) // true
         * console.log(JSON.stringify(ret3).startsWith(`"`)) // true
         */
        myDefine[`${options.mountedPath}.${key}`] = JSON.stringify(value)
      })
      config.define = {
        ...(config.define || {}),
        ...myDefine,
      }
    },
  } satisfies Plugin
}

export type { UserOptions as EnvCompatibleOptions }
export default envCompatible
