# Matriz de casos de prueba – LabTrack Grupo 5

> Documento en construcción: la plantilla completa de casos sugeridos para HU-01 a HU-05 se entrega en la fase final de documentación.

## Reglas derivadas

Reglas que no figuran literalmente en los criterios de aceptación, propuestas durante el desarrollo
y pendientes de validación por el equipo.

| ID | Regla derivada | Justificación | HU relacionada | Origen | Validación del equipo |
|----|----------------|---------------|----------------|--------|-----------------------|
| RD-01 | Un estudiante en estado "Penalizado" no puede crear reservas (validado en `logic/` y en `firestore.rules`). | Sin esta restricción la penalización de HU-05 no tendría efecto. | HU-03 / HU-05 | IA | Aprobada por el equipo (revisión de Fase 1) |
| RD-02 | El encargado puede quitar la penalización de un estudiante (estado vuelve a "Activo"). | Permite revertir la sanción una vez cumplida o justificada. | HU-05 | IA | Aprobada por el equipo (revisión de Fase 1) |
| RD-03 | El reinicio de datos para Selenium deja a todos los usuarios en "Activo" y sin reserva activa. | Garantiza independencia entre pruebas automatizadas. | Todas | IA | Aprobada por el equipo (revisión de Fase 1) |

## Casos de prueba de reglas derivadas

| ID | HU | Descripción | Precondiciones | Pasos | Datos de entrada | Resultado esperado | Tipo | Automatizado | Origen |
|----|----|-------------|----------------|-------|------------------|--------------------|------|--------------|--------|
| CP-RD-01 | HU-03 / HU-05 | Estudiante penalizado intenta reservar | Estudiante est003 en estado "Penalizado"; equipo CMP-001 "Disponible" | 1. Iniciar sesión como est003. 2. Ir a Reservas. 3. Elegir CMP-001, fecha y horario válidos. 4. Clic en "Reservar". | est003 / Estudiante123*; fecha de mañana, 10:00–12:00 | Se bloquea la reserva y #mensaje muestra que la cuenta está penalizada | Negativo | No | IA |
| CP-RD-02 | HU-05 | Encargado quita la penalización | Estudiante est003 en estado "Penalizado" | 1. Iniciar sesión como admin01. 2. Ir a Devoluciones > Penalizados. 3. Clic en "Quitar penalización" de est003. | admin01 / Admin123* | est003 pasa a "Activo" y puede volver a reservar | Positivo | No | IA |
| CP-RD-03 | Todas | Reinicio de datos antes de cada prueba | Usuarios penalizados o con reserva activa de una prueba anterior | 1. Ejecutar el reinicio de datos (seed). 2. Consultar usuarios en Firestore. | — | Todos los usuarios en "Activo" con `reservaActivaId = null` | Positivo | No | IA |
