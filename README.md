# LabTrack – Grupo 5

Sistema web de gestión de préstamos de equipos de laboratorio (Calidad y Pruebas de Software – UPN).

Frontend estático (HTML5 + Bootstrap 5 + JavaScript con módulos ES) sobre Firebase Authentication,
Cloud Firestore y Firebase Hosting (plan Spark, sin Cloud Functions).

> README en construcción: la versión completa se entrega en la Fase 6.

## Requisitos

- Node.js 20 o superior
- Java JDK 21 o superior (requerido por el emulador de Firestore)
- (Opcional) Google Chrome, JMeter y SonarScanner para las pruebas del equipo

## Inicio rápido (emuladores)

```bash
npm install
npm run serve            # terminal 1: emuladores Auth, Firestore y Hosting
npm run reset            # terminal 2: datos semilla (reinicia todo, usuarios en "Activo")
```

App: http://127.0.0.1:5000 · Emulator UI: http://127.0.0.1:4000
