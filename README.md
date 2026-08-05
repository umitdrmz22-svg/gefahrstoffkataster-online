# Gefahrstoffkataster Online

Browserbasierter, mandantenfähiger Gefahrstoffkataster für deutsche Betriebe. Die Anwendung führt die Mindestangaben des Gefahrstoffverzeichnisses mit zusätzlichen Statusfeldern für SDB, Gefährdungsbeurteilung, Betriebsanweisung, Substitutionsprüfung, CMR und Zulassungs-/Beschränkungsprüfung zusammen.

## Funktionsumfang

- vollständig online nutzbare Tabellen- und Detailansicht
- kein verpflichtender PDF-/CSV-Export
- Suche und Filter nach Produkt, Hersteller, Arbeitsbereich und Prüfstatus
- Mindestfelder nach § 6 Abs. 12 GefStoffV:
  - Bezeichnung des Gefahrstoffs
  - Einstufung oder gefährliche Eigenschaften
  - verwendeter Mengenbereich
  - Arbeitsbereiche mit möglicher Exposition
  - Verweis auf das Sicherheitsdatenblatt
- zusätzliche Felder für GHS, H-/EUH-Sätze, Lagermenge, SDB-Stand und Prüfintervall
- Status für GBU, BA, Substitution, CMR/Expositionsverzeichnis und REACH-Zulassung/Beschränkung
- Registrierung, Anmeldung und Firma/Mandant über Supabase
- Rollenbasis: `owner`, `admin`, `ersteller`, `pruefer`, `freigeber`, `leser`
- Row Level Security zur Trennung der Firmendaten
- Demo-Modus ohne Supabase-Verbindung

## Supabase einrichten

1. In Supabase den **SQL Editor** öffnen.
2. `supabase/001_core_and_kataster.sql` vollständig ausführen.
3. In `assets/config.js` eintragen:

```js
window.APP_CONFIG = Object.freeze({
  supabaseUrl: 'https://DEIN-PROJEKT.supabase.co',
  supabasePublishableKey: 'sb_publishable_...',
  appName: 'Gefahrstoffkataster Online'
});
```

Nur den Publishable Key verwenden. Niemals `service_role`, Secret Key oder Datenbankpasswort in das Repository schreiben.

## Fachliche Abgrenzung

Der Kataster unterstützt die Dokumentation. Er ersetzt nicht die fachkundige Gefährdungsbeurteilung, die Prüfung aktueller Sicherheitsdatenblätter oder die Entscheidung, ob Tätigkeiten nur eine geringe Gefährdung darstellen. Zusätzliche Informationen wie BA-, GBU- und Substitutionsstatus sind Managementfelder und erweitern den gesetzlichen Mindestinhalt.

## Testen

```bash
npm test
python3 -m http.server 4173
```
