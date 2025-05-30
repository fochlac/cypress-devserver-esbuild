import { mkdir, access } from 'fs/promises'

export const ensure = async (dir: string, log: (level: number, ...messages: any[]) => void): Promise<void> => {
  try {
    await access(dir)
  } catch (e) {
    log(4, `Creating dir "${dir}".`)
    try {
      await mkdir(dir)
    } catch (e) {
      log(4, `Error creating dir "${(e as Error).message}".`)
    }
  }
}

export const hasStringArrayContentChanged = (oldList: string[], newList: string[]): boolean => {
  return oldList.length !== newList.length || new Set([...oldList, ...newList]).size !== oldList.length
}
