"""Build the Bangla study guide HTML. Usage: python3 build.py <fonts_dir> <out.html> [toc_pages.json]
fonts_dir must contain @fontsource/tiro-bangla and @fontsource/jetbrains-mono (npm i @fontsource/tiro-bangla @fontsource/jetbrains-mono)."""
import sys, json, os
import helpers
import part1, part2, part3, part4, part5   # noqa: each module fills helpers.out

fonts, outfile = sys.argv[1], sys.argv[2]
pages = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
F = lambda pkg, f: f'file://{fonts}/@fontsource/{pkg}/files/{f}'

css = f'''
@font-face {{ font-family: "Tiro Bangla"; font-weight: 400; src: url("{F('tiro-bangla','tiro-bangla-bengali-400-normal.woff2')}") format("woff2"); unicode-range: U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC; }}
@font-face {{ font-family: "Tiro Bangla"; font-weight: 400; src: url("{F('tiro-bangla','tiro-bangla-latin-400-normal.woff2')}") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }}
@font-face {{ font-family: "JetBrains Mono"; font-weight: 400; src: url("{F('jetbrains-mono','jetbrains-mono-latin-400-normal.woff2')}") format("woff2"); }}
@font-face {{ font-family: "JetBrains Mono"; font-weight: 700; src: url("{F('jetbrains-mono','jetbrains-mono-latin-700-normal.woff2')}") format("woff2"); }}
@page {{ size: A4; margin: 17mm 15mm 19mm 15mm; @bottom-center {{ content: "Kawsar Shuvo  |  TallyLearn NGO Study Guide  |  " counter(page) " / " counter(pages); font-family: "JetBrains Mono", monospace; font-size: 7.5pt; color: #000; }} }}
@page :first {{ @bottom-center {{ content: none; }} }}
* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html {{ font-variant-ligatures: none; }}
body {{ font-family: "JetBrains Mono", "Tiro Bangla", monospace; font-size: 9.4pt; line-height: 1.75; color: #000; background: #fff; margin: 0; }}
b, strong {{ font-weight: 700; }}
.mono, .k {{ font-family: inherit; }}
.k {{ border: 0.6pt solid #000; padding: 0 3pt; font-size: 8.4pt; white-space: nowrap; }}
h1 {{ font-size: 17pt; line-height: 1.35; border-top: 2.2pt solid #000; border-bottom: 0.8pt solid #000; padding: 5pt 0; margin: 0 0 10pt; page-break-before: always; break-before: page; }}
h1 .num {{ display: inline-block; min-width: 26pt; border: 1.4pt solid #000; text-align: center; margin-right: 6pt; padding: 0 4pt; }}
h2 {{ font-size: 12.2pt; margin: 14pt 0 6pt; padding-bottom: 2pt; border-bottom: 0.8pt solid #000; break-after: avoid; }}
p {{ margin: 4pt 0 6pt; text-align: left; }}
ul, ol {{ margin: 3pt 0 7pt; padding-left: 17pt; }}
li {{ margin-bottom: 2.4pt; }}
.term {{ border: 0.8pt solid #000; padding: 6pt 8pt 3pt; margin: 8pt 0 12pt; }}
.term .th {{ border-bottom: 0.6pt dashed #000; margin: -2pt 0 4pt; padding-bottom: 2pt; break-after: avoid; }}
.term .en {{ font-weight: 700; font-size: 10.6pt; }}
.term .bn {{ font-size: 10.2pt; }}
.term p {{ margin: 3pt 0; }}
.how {{ margin: 1pt 0 4pt; }}
.ex {{ border-left: 2.4pt solid #000; padding: 2pt 0 2pt 7pt; margin: 5pt 0 5pt 2pt; background: #f2f2f2; break-inside: avoid; }}
.note {{ border: 0.8pt solid #000; padding: 4pt 7pt; margin: 7pt 0; break-inside: avoid; }}
table {{ border-collapse: collapse; width: 100%; margin: 6pt 0 9pt; font-size: 8.6pt; line-height: 1.55; }}
th, td {{ border: 0.6pt solid #000; padding: 2.4pt 5pt; vertical-align: top; text-align: left; }}
th {{ background: #e4e4e4; font-weight: 700; }}
tr {{ break-inside: avoid; }}
table.jt {{ width: 78%; margin: 5pt 0 3pt 8pt; break-inside: avoid; }}
table.jt caption {{ text-align: left; font-weight: 700; padding: 0 0 2pt; caption-side: top; }}
table.jt td:first-child {{ width: 58%; }}
.n {{ text-align: right; white-space: nowrap; }}
.narr {{ margin: 0 0 7pt 8pt; font-size: 8.4pt; }}
.q {{ border: 0.7pt solid #000; margin: 7pt 0; padding: 4pt 8pt; break-inside: avoid; }}
.qq {{ font-weight: 700; }}
.ans {{ margin-top: 3pt; border-top: 0.6pt dashed #000; padding-top: 3pt; }}
.gl td:first-child {{ width: 24%; font-size: 8.3pt; }} .gl td:nth-child(2) {{ width: 18%; }}
.cheat table {{ font-size: 9pt; }}
.cover {{ height: 255mm; border: 3pt double #000; padding: 22mm 14mm; text-align: center; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }}
.cover .t1 {{ font-size: 30pt; font-weight: 700; line-height: 1.2; letter-spacing: 0.5pt; }}
.cover .t2 {{ font-size: 24pt; margin: 8pt 0 20pt; }}
.cover .rule {{ border-top: 1.6pt solid #000; width: 60%; margin: 8pt auto 18pt; }}
.cover .sub {{ font-size: 11.5pt; line-height: 1.8; }}
.cover .by {{ margin-top: 34pt; font-size: 14pt; }}
.cover .by b {{ font-size: 17pt; }}
.cover .fine {{ margin-top: 46pt; font-size: 8pt; line-height: 1.6; }}
.toc h1 {{ page-break-before: auto; }}
.toc table {{ border: 0; font-size: 9.2pt; }} .toc td {{ border: 0; border-bottom: 0.4pt dotted #000; padding: 1.4pt 3pt; }}
.toc tr.c1 td {{ font-weight: 700; border-bottom: 0.8pt solid #000; padding-top: 5pt; }}
.toc td.pg {{ width: 28pt; text-align: right; }}
.endnote {{ margin-top: 14pt; border-top: 1pt solid #000; padding-top: 6pt; font-size: 8.4pt; }}
.mk {{ font-size: 1px; color: #fff; line-height: 0; }}
'''

# marker per heading so page numbers can be extracted from the PDF text
body = ''.join(helpers.out)
for cid, num, title, lvl in helpers.chapters:
    body = body.replace(f'<h{lvl} id="{cid}">', f'<h{lvl} id="{cid}"><span class="mk">QQ{cid}QQ</span>', 1)

toc = '<div class="toc"><h1 style="border-top:2.2pt solid #000">সূচিপত্র <span class="mono" style="font-size:11pt">(Contents)</span></h1><table>'
for cid, num, title, lvl in helpers.chapters:
    pg = pages.get(cid, '00')
    toc += f'<tr class="c{lvl}"><td>{("অধ্যায় " + num + " — ") if lvl == 1 else "&nbsp;&nbsp;&nbsp;&nbsp;"}{title}</td><td class="pg mono">{pg}</td></tr>'
toc += '</table></div>'

cover = '''<div class="cover">
<div class="t1">TallyLearn NGO</div>
<div class="t2">স্টাডি গাইড</div>
<div class="rule"></div>
<div class="sub">Tally ERP 9-স্টাইল এনজিও হিসাব সিমুলেটর<br>প্রতিটি অংশের সংজ্ঞা, কাজের ধাপ ও বাংলা উদাহরণ<br><span class="mono">Masters | Vouchers | Reports | NGO Modules | Audit</span></div>
<div class="by">লেখক: <b>Kawsar Shuvo</b></div>
<div class="fine">সব নাম ও অঙ্ক কাল্পনিক। TallyLearn NGO একটি স্বাধীন শেখার সরঞ্জাম; Tally ও Tally ERP 9 Tally Solutions-এর নিবন্ধিত ট্রেডমার্ক, এই অ্যাপ বা গাইড তাদের সাথে সম্পর্কিত নয়।<br>VAT/TDS ইত্যাদি অংশ শেখার সরলীকরণ, আইনি বা কর পরামর্শ নয়।</div>
</div>'''

open(outfile, 'w').write(f'<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>TallyLearn NGO Study Guide - Kawsar Shuvo</title><style>{css}</style></head><body>{cover}{toc}{body}</body></html>')
json.dump([c[0] for c in helpers.chapters], open(outfile + '.ids.json', 'w'))
print('chapters', len(helpers.chapters))
