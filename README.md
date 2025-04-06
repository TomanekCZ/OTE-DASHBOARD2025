# OTE Data Visualization Project

Tento projekt poskytuje webové rozhraní pro vizualizaci dat z OTE (Operátor trhu s elektřinou) včetně informací o elektřině a plynu.

## Funkce

- Zobrazení aktuálních dat z OTE pro elektřinu a plyn
- Vizualizace systémové odchylky
- Zobrazení dat z denního trhu (DT)
- Zobrazení dat z vnitrodenního trhu (VDT)
- Interaktivní grafy pro lepší analýzu dat

## Instalace

1. Naklonujte repozitář
2. Nainstalujte závislosti:

```bash
pip install -r requirements.txt
```

## Spuštění aplikace

```bash
python python.py
```

Aplikace bude dostupná na adrese `http://localhost:5000`

## Struktura projektu

- `python.py` - Hlavní soubor aplikace obsahující Flask server a logiku pro scraping dat
- `templates/` - HTML šablony pro jednotlivé stránky
- `static/` - Statické soubory (CSS, JavaScript, obrázky)
  - `js/` - JavaScript soubory pro jednotlivé stránky
  - `*.css` - CSS soubory pro stylování stránek

## Technologie

- Backend: Python, Flask, BeautifulSoup4
- Frontend: HTML, CSS, JavaScript, Chart.js

## Konfigurace

Aplikace používá následující konfigurační parametry:

- Cache timeout: 300 sekund (5 minut)
- Debug mode: Zapnuto pro vývojové prostředí

## Licence

Tento projekt je licencován pod MIT licencí.
