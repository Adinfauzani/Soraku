import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

import { defineConfig } from 'electron-vite'

import type { Plugin } from 'vite'

const pkgName = (pkg: string) => pkg.replace(/@/g, '').replace(/\//g, '-')

const nativeModuleDir = (pkg: string) => `native-modules/${pkgName(pkg)}`

function copyDirRecursive (src: string, dst: string, fileFilter?: (name: string) => boolean) {
  if (!existsSync(dst)) mkdirSync(dst, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory() && fileFilter && !fileFilter(entry.name)) continue
    const srcPath = join(src, entry.name)
    const dstPath = join(dst, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath, fileFilter)
    } else {
      copyFileSync(srcPath, dstPath)
    }
  }
}

const compileNativeModulesPlugin = ({ dependencies: NATIVE_PACKAGES }: { dependencies: string[] }): Plugin => {
  let outDir: string

  const staticAssets = new Map<string, { src: string, dst: string }>()
  let assetCounter = 0

  const pendingModules = new Map<string, { pkgDir: string, moduleDir: string }>()

  return {
    name: 'vite:fix-native-module-dirs',
    enforce: 'pre',
    configResolved (config) {
      outDir = resolve(config.build.outDir)
    },
    transform (code, id) {
      const matchedPkg = NATIVE_PACKAGES.find(pkg => id.includes(`/node_modules/${pkg}/`))
      if (!matchedPkg) return null

      const hasDirRefs = code.includes('__dirname') || code.includes('__filename')
      const hasNodeRequire = /require\s*\(\s*['"`]((?:\.\.?\/).*?\.node)['"`]\s*\)/.test(code)

      if (!hasDirRefs && !hasNodeRequire) return null

      const pkgMarker = `/node_modules/${matchedPkg}/`
      const pkgIdx = id.lastIndexOf(pkgMarker)
      const withinPkg = pkgIdx !== -1 ? id.substring(pkgIdx + pkgMarker.length) : basename(id)

      let newCode = code

      const pkgRoot = resolve(id.substring(0, pkgIdx + '/node_modules/'.length), matchedPkg)

      if (hasNodeRequire) {
        newCode = newCode.replace(
          /require\s*\(\s*(['"`])((?:\.\.?\/).*?\.node)\1\s*\)/g,
          (_match, _quote, filePath) => {
            const absolutePath = resolve(dirname(id), filePath)
            const assetName = `${pkgName(matchedPkg)}-${basename(absolutePath)}`
            const dstRel = `native-assets/${assetCounter++}-${assetName}`
            const dst = resolve(outDir, dstRel)
            staticAssets.set(dstRel, { src: absolutePath, dst })
            return `require(__dirname + "/${dstRel}")`
          }
        )
      }

      if (hasDirRefs) {
        const modulesDir = nativeModuleDir(matchedPkg)
        const withinDir = dirname(withinPkg)
        const relModulePath = withinDir !== '.' ? `${modulesDir}/${withinDir}` : modulesDir

        if (!pendingModules.has(matchedPkg)) {
          pendingModules.set(matchedPkg, {
            pkgDir: pkgRoot,
            moduleDir: resolve(outDir, modulesDir)
          })
        }

        newCode = newCode
          .replace(/\b__dirname\b(?!\s*:)/g, `__dirname + "/${relModulePath}"`)
          .replace(/\b__filename\b(?!\s*:)/g, `__dirname + "/${relModulePath}/${basename(id)}"`)
      }

      if (newCode === code) return null

      return { code: newCode, map: null }
    },
    writeBundle () {
      for (const [, { src, dst }] of staticAssets) {
        try {
          const dstDir = dirname(dst)
          if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true })
          copyFileSync(src, dst)
          console.log(`[native-assets] Copied ${src} -> ${dst}`)
        } catch (err) {
          console.error(`[native-assets] Failed to copy ${src}: `, err)
        }
      }
      staticAssets.clear()
      assetCounter = 0

      for (const { pkgDir, moduleDir } of pendingModules.values()) {
        try {
          const pkgJson = join(pkgDir, 'package.json')
          if (existsSync(pkgJson)) {
            if (!existsSync(moduleDir)) mkdirSync(moduleDir, { recursive: true })
            copyFileSync(pkgJson, join(moduleDir, 'package.json'))
          }

          const prebuildsSrc = join(pkgDir, 'prebuilds')
          if (existsSync(prebuildsSrc)) {
            const prebuildsDst = join(moduleDir, 'prebuilds')
            const platformDirs: string[] = process.platform === 'win32'
              ? ['win32-x64']
              : process.platform === 'darwin'
                ? ['darwin-x64', 'darwin-arm64']
                : ['linux-x64']
            for (const dir of readdirSync(prebuildsSrc, { withFileTypes: true })) {
              if (dir.isDirectory() && platformDirs.includes(dir.name)) {
                copyDirRecursive(join(prebuildsSrc, dir.name), join(prebuildsDst, dir.name), (name) => name.endsWith('.node'))
              }
            }
            console.log(`[native-modules] Copied prebuilds for ${basename(moduleDir)}`)
          }
        } catch (err) {
          console.error(`[native-modules] Failed to setup ${pkgDir}: `, err)
        }
      }
      pendingModules.clear()
    }
  }
}

export default defineConfig({
  main: {
    build: {
      commonjsOptions: {
        ignore: (id: string) => id.endsWith('.node'),
        ignoreDynamicRequires: true
      }
    },
    plugins: [
      compileNativeModulesPlugin({
        dependencies: ['@thaunknown/yencode', '@thaunknown/utp-native']
      })
    ],
    resolve: {
      alias: {
        'http-tracker': resolve(__dirname, 'src/main/patches/http-tracker.cjs'),
        'webrtc-polyfill': resolve(__dirname, 'src/main/patches/webrtc-polyfill.cjs'),
        querystring: 'node:querystring',
        events: 'node:events',
        zlib: 'node:zlib',
        '@soraku/native': resolve(__dirname, '../../packages/native/src/index.ts'),
        '@soraku/torrent-client': resolve(__dirname, '../../packages/torrent-client/index.ts')
      }
    }
  },
  preload: {
    build: {
      commonjsOptions: {
        ignore: (id: string) => id.endsWith('.node'),
        ignoreDynamicRequires: true
      }
    }
  }
})