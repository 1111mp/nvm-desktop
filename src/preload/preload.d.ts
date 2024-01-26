import { ElectronHandler } from './index'

declare global {
  interface Window {
    Context: ElectronHandler
  }
}

export {}
