import { ElectronHandler } from './preload'

declare global {
  interface Window {
    Context: ElectronHandler
  }
}

export {}
