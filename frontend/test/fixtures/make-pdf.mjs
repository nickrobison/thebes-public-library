// Generates a small, structurally valid multi-page PDF for e2e fixtures.
// Byte offsets for the xref table are computed from the assembled body, so the
// output is a real PDF that PDF.js will parse (not just a %PDF header stub).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, 'sample.pdf')

const PAGE_TEXT = [
  'Hello Page One',
  'Hello Page Two',
  'Hello Page Three',
]

const objects = []
// Object numbering: 1 catalog, 2 pages, then per page (page obj, content obj), then font.
const fontObjNum = 3 + PAGE_TEXT.length * 2

objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
objects[2] = `<< /Type /Pages /Kids [${PAGE_TEXT.map(
  (_, i) => `${3 + i * 2} 0 R`,
).join(' ')}] /Count ${PAGE_TEXT.length} >>`

PAGE_TEXT.forEach((text, i) => {
  const pageNum = 3 + i * 2
  const contentNum = pageNum + 1
  const stream = `BT /F1 20 Tf 24 120 Td (${text}) Tj ET`
  objects[pageNum] =
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] ` +
    `/Contents ${contentNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`
  objects[contentNum] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
})

objects[fontObjNum] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

let body = '%PDF-1.4\n'
const offsets = []
for (let num = 1; num < objects.length; num++) {
  const content = objects[num]
  if (content === undefined) continue
  offsets[num] = body.length
  body += `${num} 0 obj\n${content}\nendobj\n`
}

const xrefStart = body.length
let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`
for (let num = 1; num < objects.length; num++) {
  if (offsets[num] === undefined) {
    xref += '0000000000 65535 f \n'
  } else {
    xref += `${String(offsets[num]).padStart(10, '0')} 00000 n \n`
  }
}
const trailer = `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

const pdf = Buffer.from(body + xref + trailer, 'latin1')
mkdirSync(here, { recursive: true })
writeFileSync(outPath, pdf)

console.log(`wrote ${outPath} (${pdf.length} bytes, ${PAGE_TEXT.length} pages)`)
