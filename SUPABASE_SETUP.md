# 🚀 Supabase Setup für Certano

## **📋 Voraussetzungen:**
- Supabase-Account (kostenlos auf [supabase.com](https://supabase.com))
- Node.js und npm installiert

## **🔧 Supabase-Projekt erstellen:**

### **1. Neues Projekt erstellen:**
1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke "New Project"
3. Wähle deine Organisation
4. Gib dem Projekt einen Namen: `certano`
5. Wähle ein Datenbank-Passwort (merke es dir!)
6. Wähle eine Region (z.B. West Europe)
7. Klicke "Create new project"

### **2. Projekt-URL und API-Key finden:**
1. Gehe zu "Settings" → "API"
2. Kopiere die "Project URL"
3. Kopiere den "anon public" Key

### **3. Environment-Variablen setzen:**
Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=deine_project_url_hier
VITE_SUPABASE_ANON_KEY=dein_anon_key_hier

# App Configuration
VITE_APP_NAME=Certano
VITE_APP_VERSION=1.0.0
```

## **🗄️ Datenbank-Schema einrichten:**

### **1. SQL Editor öffnen:**
1. Gehe zu "SQL Editor" im Supabase Dashboard
2. Klicke "New Query"

### **2. Schema ausführen:**
1. Kopiere den Inhalt von `supabase-schema.sql`
2. Füge ihn in den SQL Editor ein
3. Klicke "Run"

## **🔐 Authentication einrichten:**

### **1. Email-Auth aktivieren:**
1. Gehe zu "Authentication" → "Settings"
2. Stelle sicher, dass "Enable email confirmations" aktiviert ist
3. Optional: "Enable phone confirmations" deaktivieren

### **2. Social Auth (optional):**
1. Gehe zu "Authentication" → "Providers"
2. Aktiviere gewünschte Provider (Google, GitHub, etc.)

## **📁 Storage einrichten:**

### **1. Storage Bucket erstellen:**
1. Gehe zu "Storage" → "Buckets"
2. Der Bucket "images" wird automatisch erstellt
3. Stelle sicher, dass "Public bucket" aktiviert ist

## **🚀 App starten:**

### **1. Dependencies installieren:**
```bash
npm install
```

### **2. App starten:**
```bash
npm run dev
```

## **✅ Testen:**

### **1. Authentication testen:**
- Registriere einen neuen Benutzer
- Melde dich an/ab
- Überprüfe die Session

### **2. Datenbank testen:**
- Erstelle ein Kapitel
- Erstelle eine Frage
- Überprüfe die Daten in Supabase

## **🔧 Troubleshooting:**

### **Fehler: "Missing Supabase environment variables"**
- Überprüfe, ob `.env.local` existiert
- Stelle sicher, dass die Variablen korrekt gesetzt sind
- Starte den Dev-Server neu

### **Fehler: "Invalid API key"**
- Überprüfe den API-Key in der `.env.local`
- Stelle sicher, dass der Key aus dem richtigen Projekt stammt

### **Fehler: "Table does not exist"**
- Führe das SQL-Schema erneut aus
- Überprüfe, ob alle Tabellen erstellt wurden

## **📚 Nächste Schritte:**

1. **Frontend anpassen** für Supabase-APIs
2. **Zustand-Store aktualisieren** für Supabase
3. **Image-Upload implementieren**
4. **Real-time Features aktivieren**

## **🎯 Vorteile von Supabase:**

- ✅ **Sofort einsatzbereit** - Keine Server-Konfiguration
- ✅ **Automatische API** - Alle CRUD-Operationen
- ✅ **Real-time Features** - Live-Updates
- ✅ **Authentication** - Bereits integriert
- ✅ **Storage** - Für Bilder und Medien
- ✅ **Dashboard** - Einfache Datenverwaltung
- ✅ **Skalierbar** - Von kostenlos bis Enterprise

---

**Fragen? Schau in die [Supabase Docs](https://supabase.com/docs) oder erstelle ein Issue!** 🚂✨


