import { I18nScreen, i18nMeta } from '../../src/I18nScreen'
import { pageMetadata } from '../../src/metadata'

export function generateMetadata() {
  return pageMetadata(i18nMeta('de'))
}

export default function I18nGermanScreen() {
  return <I18nScreen language="de" />
}
