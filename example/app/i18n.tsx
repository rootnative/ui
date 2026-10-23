import { I18nScreen, i18nMeta } from '../src/I18nScreen'
import { pageMetadata } from '../src/metadata'

export function generateMetadata() {
  return pageMetadata(i18nMeta('en'))
}

export default function I18nEnglishScreen() {
  return <I18nScreen language="en" />
}
