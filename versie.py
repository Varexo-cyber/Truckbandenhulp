"""Zet een nieuw versienummer achter site.css en de scripts in alle pagina's.

Draai dit na elke wijziging in assets/css of assets/js, zodat bezoekers
direct de nieuwe versie krijgen in plaats van een oude uit hun cache:

    python3 versie.py
"""
import pathlib, re, time

versie = time.strftime('%Y%m%d%H%M')
patroon = re.compile(r'(assets/(?:css/site\.css|js/(?:app|config|icons)\.js))(\?v=\d+)?"')
aantal = 0
for pad in pathlib.Path(__file__).parent.rglob('*.html'):
    tekst = pad.read_text(encoding='utf-8')
    nieuw = patroon.sub(lambda m: f'{m.group(1)}?v={versie}"', tekst)
    if nieuw != tekst:
        pad.write_text(nieuw, encoding='utf-8')
        aantal += 1
print(f'versie {versie} gezet in {aantal} pagina\'s')
