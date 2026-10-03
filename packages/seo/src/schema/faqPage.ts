import type { JsonLd } from '../types'
import { jsonLd, thing } from './compact'

export type Faq = { question: string; answer: string }

export function faqPage(questions: Faq[]): JsonLd {
  return jsonLd('FAQPage', {
    mainEntity: questions.map((faq) =>
      thing('Question', {
        name: faq.question,
        acceptedAnswer: thing('Answer', { text: faq.answer }),
      }),
    ),
  })
}
