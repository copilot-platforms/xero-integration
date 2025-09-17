import { htmlToText as libHtmlToText } from 'html-to-text'

/**
 * Converts HTML to text with some predefined best parctices
 * @param html Html string
 * @returns Sanitized string with HTML characters removed, semantically structured
 */
export const htmlToText = (html: string): string => {
  return libHtmlToText(html, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
      { selector: 'img', format: 'skip' },
    ],
  })
}
