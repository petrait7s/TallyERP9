import html as _h

def esc(s): return _h.escape(s, quote=False)

chapters = []   # (id, title)
out = []

def chapter(num, title):
    cid = f"ch{num}"
    chapters.append((cid, num, title, 1))
    out.append(f'<h1 id="{cid}"><span class="num">{num}</span> {title}</h1>')

def section(cid, title):
    chapters.append((cid, '', title, 2))
    out.append(f'<h2 id="{cid}">{title}</h2>')

def p(text): out.append(f'<p>{text}</p>')
def ul(items): out.append('<ul>' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>')
def ol(items): out.append('<ol>' + ''.join(f'<li>{i}</li>' for i in items) + '</ol>')
def note(text, label='মনে রাখুন'): out.append(f'<div class="note"><b>{label}:</b> {text}</div>')
def warn(text): note(text, 'সতর্কতা')

def jt(title, rows, narr=None):
    """journal table: rows = (ledger, dr, cr)"""
    t = f'<table class="jt"><caption>{title}</caption><tr><th>Ledger</th><th>Dr (Tk)</th><th>Cr (Tk)</th></tr>'
    for l, d, c in rows:
        t += f'<tr><td>{l}</td><td class="n">{d}</td><td class="n">{c}</td></tr>'
    t += '</table>'
    if narr: t += f'<div class="narr">Narration: {narr}</div>'
    out.append(t)

def table(head, rows, cls='kt'):
    t = f'<table class="{cls}"><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr>'
    for r in rows: t += '<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>'
    out.append(t + '</table>')

def term(en, bn, definition, how=None, example=None, keys=None):
    """one dictionary-style entry"""
    b = f'<div class="term"><div class="th"><span class="en">{en}</span> <span class="bn">({bn})</span></div>'
    b += f'<p><b>সংজ্ঞা:</b> {definition}</p>'
    if how:
        b += '<p class="lab"><b>কীভাবে কাজ করে:</b></p><ol class="how">' + ''.join(f'<li>{i}</li>' for i in how) + '</ol>'
    if keys: b += f'<p><b>কী:</b> <span class="k">{keys}</span></p>'
    if example: b += f'<div class="ex"><b>উদাহরণ:</b> {example}</div>'
    b += '</div>'
    out.append(b)

def raw(s): out.append(s)
