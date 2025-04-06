# Doporučení pro vylepšení kódu (python.py)

Tento dokument shrnuje doporučení pro vylepšení a refactoring Python kódu v souboru `python.py` pro Flask aplikaci OTE scraper.

## 1. Struktura projektu a Refactoring

**Současný stav:** Veškerá logika aplikace (Flask instance, konfigurace, scrapovací funkce, definice HTML a API rout) je obsažena v jediném souboru `python.py`.

**Doporučení:** Rozdělit kód do více souborů pro lepší přehlednost, údržbu a škálovatelnost. Navrhovaná struktura:

*   `run.py`: Hlavní spouštěcí skript aplikace (podobný tomu, který byl smazán). Importuje a spouští Flask aplikaci.
*   `config.py`: Konfigurační nastavení (viz bod 4).
*   `app/`: Adresář pro hlavní kód aplikace.
    *   `__init__.py`: Vytvoření instance Flask aplikace (Application Factory pattern), inicializace rozšíření (např. Cache), registrace Blueprints.
    *   `scraper.py`: Obsahuje funkce pro scrapování dat (`scrape_ote_data`, `scrape_gas_data` a případné pomocné funkce).
    *   `routes.py` (nebo `views.py`): Definice Flask rout (HTML i API). Může být dále rozdělen pomocí Blueprints (např. `main_routes.py`, `api_routes.py`).
    *   `templates/`: (Již existuje) Pro HTML šablony.
    *   `static/`: (Již existuje) Pro statické soubory (CSS, JS, obrázky).
*   `requirements.txt`: (Již existuje) Seznam závislostí.

**Přínosy:**
*   Lepší organizace kódu.
*   Snadnější orientace v projektu.
*   Možnost znovupoužití komponent.
*   Jednodušší testování jednotlivých částí.

## 2. Vylepšení Scrapovací Logiky (`scrape_ote_data`, `scrape_gas_data`)

**Současný stav:** Funkce jsou dlouhé, obsahují logiku pro HTTP requesty, HTML parsing, extrakci dat a jejich čištění. Používají se `print()` pro debugování. Error handling používá obecné `Exception`.

**Doporučení:**

*   **Oddělení zodpovědností:** Vytvořit pomocné funkce uvnitř `scraper.py`, např.:
    *   Funkce pro získání a základní zpracování HTML (`requests` + `BeautifulSoup`).
    *   Funkce pro parsování specifických tabulek nebo sekcí stránky.
    *   Funkce pro čištění konkrétních typů dat (ceny, množství, odstranění jednotek).
*   **Error Handling:** Místo obecného `except Exception:`, zachytávat specifičtější výjimky (např. `requests.exceptions.RequestException`, `AttributeError` při parsování, `ValueError` při konverzi dat), aby bylo jasnější, co selhalo.
*   **Logging:** Nahradit všechny `print()` výpisy voláním nakonfigurovaného loggeru (`logger.debug()`, `logger.info()`, `logger.error()`).
*   **Konstanty:** Definovat URL `https://www.ote-cr.cz/cs` jako konstantu na začátku modulu `scraper.py`.

## 3. Konsolidace Rout

**Současný stav:** Existují dvě routy (`/ida1` a `/vdt-ida1`), které obě renderují stejnou šablonu `VDT-IDA1.html`.

**Doporučení:** Odstranit jednu z duplicitních rout, aby se předešlo nejasnostem. Vybrat tu, která je logičtější nebo používanější.

## 4. Správa Konfigurace

**Současný stav:** Nastavení jako `CACHE_TYPE`, `CACHE_DEFAULT_TIMEOUT` a `debug=True` jsou napevno zapsána v kódu.

**Doporučení:**

*   Vytvořit soubor `config.py` nebo použít environmentální proměnné.
*   Načítat konfiguraci z tohoto zdroje v `app/__init__.py` (při použití struktury z bodu 1) nebo na začátku `python.py` (pokud se struktura nemění).
*   Pro lokální vývoj lze použít soubor `.env` a knihovnu `python-dotenv` pro načtení proměnných prostředí.
*   Nastavení `debug` by mělo být typicky zapnuto jen pro vývojové prostředí.

## 5. Správa Závislostí

**Současný stav:** Existuje soubor `requirements.txt`.

**Doporučení:** Pravidelně ověřovat a aktualizovat `requirements.txt`. Měl by obsahovat všechny potřebné knihovny (`requests`, `beautifulsoup4`, `Flask`, `Flask-Caching`) ideálně s připnutými verzemi (`Flask==2.x.x`), aby bylo zajištěno konzistentní prostředí. To lze generovat např. pomocí `pip freeze > requirements.txt`.

## 6. Konzistence Logování

**Současný stav:** Logování je nastaveno, ale stále se používají `print()` výpisy.

**Doporučení:** Důsledně používat nakonfigurovaný `logger` (`logger.debug`, `logger.info`, `logger.warning`, `logger.error`) pro všechny diagnostické a informační výpisy.

## 7. Čitelnost Kódu

**Doporučení:**

*   Přidat komentáře vysvětlující složitější části kódu, zejména v logice scrapování.
*   Používat smysluplné názvy proměnných a funkcí.
*   Formátovat kód podle standardu PEP 8 (lze použít nástroje jako `black` nebo `flake8`). 