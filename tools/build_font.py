# Builds the game font: Fredoka (OFL) plus composed Turkish letters (ğĞşŞİ) that Fredoka lacks.
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools.varLib import instancer
from fontTools import subset

SRC = '/home/claude/vendor/gfonts/ofl/fredoka/Fredoka[wdth,wght].ttf'
OUT = '/home/claude/game3/src/fonts/fredoka.woff'
f = TTFont(SRC)
glyf = f['glyf']; hmtx = f['hmtx']; gvar = f['gvar']

def bbox(name):
    g = glyf[name]; g.recalcBounds(glyf)
    return g.xMin, g.yMin, g.xMax, g.yMax

def compose(new, base, accent, where, uni):
    bx0, by0, bx1, by1 = bbox(base)
    ax0, ay0, ax1, ay1 = bbox(accent)
    dx = round((bx0 + bx1) / 2 - (ax0 + ax1) / 2)
    if where == 'above':
        dy = round(by1 + 50 - ay0)
    else:  # below: the cedilla hangs from the baseline
        dy = round(0 - ay1 + 40)
    g = Glyph(); g.numberOfContours = -1; g.components = []
    for name, x, y in ((base, 0, 0), (accent, dx, dy)):
        c = GlyphComponent(); c.glyphName = name; c.x = x; c.y = y; c.flags = 0x4  # ROUND_XY_TO_GRID
        g.components.append(c)
    g.components[0].flags |= 0x200  # USE_MY_METRICS
    glyf.glyphs[new] = g
    if new not in f.getGlyphOrder():
        f.setGlyphOrder(f.getGlyphOrder() + [new])
    hmtx.metrics[new] = hmtx.metrics[base]
    gvar.variations[new] = []
    for table in f['cmap'].tables:
        if table.isUnicode():
            table.cmap[uni] = new

compose('gbreve', 'g', 'breve', 'above', 0x011F)
compose('Gbreve', 'G', 'breve', 'above', 0x011E)
compose('Idotaccent', 'I', 'dotaccent', 'above', 0x0130)
compose('scedilla', 's', 'cedilla', 'below', 0x015F)
compose('Scedilla', 'S', 'cedilla', 'below', 0x015E)
f['maxp'].numGlyphs = len(f.getGlyphOrder())
f.save('/tmp/claude-0/font/fredoka_tr.ttf')

f = TTFont('/tmp/claude-0/font/fredoka_tr.ttf')
ranges = list(range(0x20, 0x7f)) + list(range(0xa0, 0x180)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2022, 0x2026, 0x20ac, 0x2122, 0x2039, 0x203a]
opts = subset.Options(); opts.layout_features = ['kern', 'liga', 'calt', 'locl']; opts.name_IDs = ['*']; opts.notdef_outline = True
s = subset.Subsetter(opts); s.populate(unicodes=ranges); s.subset(f)
f.save('/tmp/claude-0/font/sub.ttf')
f = TTFont('/tmp/claude-0/font/sub.ttf')
f = instancer.instantiateVariableFont(f, {'wdth': 100, 'wght': (500, 700)})
f.flavor = 'woff'; f.save(OUT)
cm = TTFont(OUT).getBestCmap()
print('missing:', [c for c in 'ğĞıİşŞçÇöÖüÜßàéèêëîïôœùûÿñ¿¡' if ord(c) not in cm])
