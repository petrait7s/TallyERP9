import subprocess, json, re, sys
pdf, ids_file, out = sys.argv[1:4]
ids = json.load(open(ids_file))
n = int(re.search(r'Pages:\s+(\d+)', subprocess.check_output(['pdfinfo', pdf]).decode()).group(1))
pages = {}
for pg in range(1, n + 1):
    t = subprocess.check_output(['pdftotext', '-f', str(pg), '-l', str(pg), '-layout', pdf, '-']).decode('utf-8', 'ignore')
    for cid in ids:
        if f'QQ{cid}QQ' in t and cid not in pages: pages[cid] = f'{pg:02d}'
print('found', len(pages), 'of', len(ids), 'pages', n)
json.dump(pages, open(out, 'w'))
