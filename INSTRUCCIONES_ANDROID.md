# 🚀 INSTRUCCIONES DE COMPILACIÓN — ASTRO NOVA ANDROID

Este documento explica cómo compilar, instalar y probar el APK de ASTRO NOVA para Android (móvil, tablet y Android TV) usando **Capacitor** y **Gradle**.

---

## 📋 PRERREQUISITOS

Antes de comenzar, instala lo siguiente en tu computadora:

### 1. Node.js (v18 o superior)
```bash
# Verificar instalación
node --version
npm --version
```

### 2. Java JDK 21 (requerido por Android Gradle Plugin 8.13)
```bash
# macOS con Homebrew
brew install openjdk@21

# Verificar
java -version
```

### 3. Android Studio + Android SDK
Descarga e instala [Android Studio](https://developer.android.com/studio).

Durante la instalación, asegúrate de marcar:
- **Android SDK**
- **Android SDK Platform-Tools** (incluye `adb`)
- **Android SDK Build-Tools**
- **Android Emulator** (opcional, para pruebas)

Configura las variables de entorno (ejemplo para macOS, añadir a `~/.zshrc` o `~/.bash_profile`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

Luego: `source ~/.zshrc`

### 4. Capacitor CLI (opcional, global)
```bash
npm install -g @capacitor/cli @capacitor/android
```

---

## 📦 PASO 1 — INSTALAR DEPENDENCIAS

Desde la carpeta del proyecto:

```bash
cd "/Users/usuario/Documents/ASTROBOT ANDROID/Astro-bot-main"
npm install
```

Esto instalará todas las dependencias de npm, incluyendo:
- React 19, TypeScript, Three.js, Vite
- Capacitor (core, cli, android)
- Tailwind CSS, Lucide React, Motion

---

## 🏗️ PASO 2 — CONSTRUIR EL JUEGO WEB (VITE)

Compila los archivos estáticos del juego (React + Three.js) para producción:

```bash
npm run build
```

Esto genera la carpeta `dist/` con todo el juego empaquetado:
- HTML, CSS, JS minificados
- Recursos (texturas, iconos, etc.)
- Service Worker (PWA) para caché sin conexión

**Verificación:** La carpeta `dist/` debe contener `index.html`, `assets/`, `sw.js`, `manifest.webmanifest`.

---

## 🔗 PASO 3 — SINCRONIZAR CON CAPACITOR (ANDROID)

Copia los archivos web al proyecto nativo de Android:

```bash
npx cap sync android
```

Esto hace:
- Copia `dist/` → `android/app/src/main/assets/public/`
- Genera `capacitor.config.json` en los assets de Android
- Sincroniza plugins de Capacitor

**Verificación:** Después de esto, `android/app/src/main/assets/public/` debe contener `index.html` y `assets/`.

---

## 📱 PASO 4 — GENERAR EL APK

### Opción A: APK de Debug (para pruebas)

```bash
cd android
./gradlew assembleDebug
```

El APK se genera en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción B: APK de Release (firmado, para distribución)

Primero, genera un keystore de firma (si no tienes uno):

```bash
keytool -genkeypair -v -keystore astronova-release.keystore -alias astronova -keyalg RSA -keysize 2048 -validity 10000
```

Luego configura el firmado en `android/app/build.gradle` (sección `signingConfigs`) y ejecuta:

```bash
cd android
./gradlew assembleRelease
```

El APK se genera en:
```
android/app/build/outputs/apk/release/app-release.apk
```

> **Nota:** Para instalar un APK de release en un dispositivo, debe estar firmado. El APK de debug ya está firmado con la clave de debug de Android.

---

## 📦 PASO 5 — GENERAR EL AAB (Android App Bundle)

Para publicación en Google Play Store (futuro):

```bash
cd android
./gradlew bundleRelease
```

El AAB se genera en:
```
android/app/build/outputs/bundle/release/app-release.aab
```

El AAB es el formato recomendado para Google Play porque permite entrega optimizada por dispositivo (APKs divididos por arquitectura, densidad de pantalla, idioma).

---

## 📲 PASO 6 — INSTALAR EN DISPOSITIVOS

### Teléfono Android

```bash
# Conectar el teléfono por USB y habilitar "Depuración USB"
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

O copia el APK al teléfono e instálalo desde un gestor de archivos.

### Tablet Android

Mismo procedimiento que el teléfono:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

La aplicación detectará automáticamente que es una tablet (pantalla grande ≥600dp) y adaptará:
- Controles táctiles más grandes
- Distribución mejorada del HUD
- Soporte para mandos Bluetooth

### Android TV / Google TV

#### Opción 1: ADB (recomendado para desarrollo)

```bash
# Conectar por ADB (red o USB)
adb connect IP_DE_TU_TV:5555
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### Opción 2: USB

Copia el APK a una memoria USB, conéctala a la TV e instálalo con un gestor de archivos (ej. FX File Explorer, Send Files to TV).

#### Opción 3: Downloader (en la TV)

Instala la app **Downloader by AFTVnews** desde Google Play en la TV, habilita "Instalar aplicaciones desconocidas" para Downloader, introduce la URL donde está alojado el APK e instálalo.

**Verificación en TV:** La aplicación debe aparecer en el menú de aplicaciones de la TV (gracias a la categoría `LEANBACK_LAUNCHER` en el `AndroidManifest.xml`).

---

## 🎮 PASO 7 — PROBAR CONTROLES

### Controles táctiles (móvil / tablet)

- **Joystick virtual** (lado inferior izquierdo): Desplazamiento del personaje
- **Botón Salto/Turbo/Térmica/Ola** (lado inferior derecho, grande): Saltar, doble salto, activar habilidad según el modo
- **Botón Girar** (inferior derecho): Ataque giratorio
- **Botón Arco** (inferior derecho, si tienes arco): Disparar flecha
- **Botón Pausa** (superior derecho): Pausar el juego
- **Botones Mute/Música** (superior derecho): Control de audio

Los controles son transparentes y se adaptan al tamaño de pantalla.

### Navegación por mando (Android TV / Bluetooth)

- **D-pad** (cruceta del mando remoto): Moverse en menús y en el juego
- **Botón Centro / OK / A**: Saltar / seleccionar en menús
- **Botón B / X**: Giro / disparar arco
- **Botón Start / Opciones**: Pausar
- **Botón Volver**: Regresar al menú anterior / salir

### Detección automática de dispositivo

La aplicación detecta automáticamente:
| Dispositivo | Controles mostrados |
|-------------|---------------------|
| Teléfono | Joystick virtual + botones táctiles |
| Tablet | Joystick virtual más grande + botones táctiles |
| Android TV | Sin controles táctiles, navegación por D-pad |

---

## 🔄 PASO 8 — GENERAR UNA VERSION ACTUALIZADA

Para lanzar una actualización del juego:

1. Modifica el código fuente en `src/`
2. Reconstruye el juego web:
   ```bash
   npm run build
   ```
3. Sincroniza con Android:
   ```bash
   npx cap sync android
   ```
4. Regenera el APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
5. Instala el nuevo APK (sobreescribe la versión anterior):
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

El progreso del jugador (niveles desbloqueados, coleccionables, monedas, récords, configuración) se guarda en `localStorage` y se conserva entre actualizaciones.

---

## 🧪 PRUEBAS OBLIGATORIAS

Antes de considerar la versión como final, verifica:

| # | Prueba | Cómo verificar |
|---|--------|----------------|
| 1 | Inicio del juego | Abre la app, debe aparecer la pantalla de título con "ASTRO NOVA" |
| 2 | Ocho niveles | En la pantalla de título, aparecen 8 tarjetas de niveles (01-08) |
| 3 | Ocho escenarios | Cada nivel carga su escenario distintivo (jungla, desierto, hielo, templo, volcán, nebulosa, París, río) |
| 4 | Controles táctiles | En móvil/tablet, el joystick y botones responden al tacto |
| 5 | Navegación D-pad | En TV, el mando remoto navega por menús y mueve al personaje |
| 6 | Mandos Bluetooth | Conecta un mando Bluetooth y verifica que los botones funcionen |
| 7 | Sonido | Música y efectos se reproducen al iniciar un nivel |
| 8 | Colisiones | El personaje choca con plataformas, enemigos y peligros correctamente |
| 9 | Guardado | Completa un nivel, cierra la app, vuelve a abrir y el progreso persiste |
| 10 | Pantalla completa | El juego ocupa toda la pantalla sin barras del sistema |
| 11 | Sin errores de consola | Abre `adb logcat` y verifica que no haya errores JS/WebGL |
| 12 | Carga de recursos locales | Todas las texturas y modelos cargan desde `assets/public/` sin internet |
| 13 | Rendimiento gráfico | El juego mantiene 30-60 FPS estable en el dispositivo |

### Verificar errores de consola (Android)

```bash
adb logcat | grep -i "console\|error\|warning\|three\|three.js"
```

### Verificar progreso guardado

El progreso se almacena en `localStorage` bajo la clave `astro-nova-progress-v1`. Puedes inspeccionarlo con Chrome DevTools (remoto) conectando el dispositivo por USB y abriendo `chrome://inspect`.

---

## 📁 ESTRUCTURA DEL PROYECTO

```
Astro-bot-main/
├── src/                         # Código fuente del juego (React + TypeScript + Three.js)
│   ├── components/              # Componentes UI (HUD, Menús, Controles táctiles, Splash, TV)
│   ├── game/                    # Motor del juego (Engine, niveles, audio, física, texturas, shaders)
│   ├── hooks/                   # Hooks personalizados (detección de dispositivo, gamepad, PWA)
│   ├── contexts/                # Contexto de dispositivo (móvil/tablet/TV)
│   ├── App.tsx                  # Punto de entrada principal
│   └── main.tsx                 # Renderizador React
├── dist/                        # Build de producción (generado por Vite)
├── android/                     # Proyecto nativo Android (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml    # Configuración Android TV + móvil
│   │   │   ├── java/com/astronova3d/tv/MainActivity.java
│   │   │   ├── res/                   # Recursos (iconos, splash, banner TV)
│   │   │   └── assets/public/         # Archivos web del juego (copiados por Capacitor)
│   │   ├── build.gradle               # Configuración de Gradle (app)
│   │   └── proguard-rules.pro
│   ├── build.gradle                 # Configuración de Gradle (raíz)
│   ├── gradle.properties
│   ├── settings.gradle
│   └── variables.gradle             # Versiones de SDK y dependencias
├── capacitor.config.ts            # Configuración de Capacitor
├── vite.config.ts                 # Configuración de Vite
├── package.json                   # Dependencias npm
├── INSTRUCCIONES_ANDROID.md       # Este archivo
└── README.md                      # Documentación original del juego
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| `./gradlew: permiso denegado` | Ejecuta `chmod +x gradlew` |
| `SDK location not found` | Configura `ANDROID_HOME` o crea `android/local.properties` con `sdk.dir=/ruta/al/android-sdk` |
| El juego no se ve en Android TV | Verifica que `AndroidManifest.xml` tenga `<category android:name="android.intent.category.LEANBACK_LAUNCHER" />` |
| Controles táctiles no aparecen | Verifica que el dispositivo sea detectado como móvil/tablet (`isTouchDevice`) |
| Sonido no se reproduce | En Android, el audio requiere interacción del usuario; el juego llama a `soundEngine.unlock()` al iniciar |
| APK muy grande | Usa `./gradlew bundleRelease` para generar AAB (entrega optimizada) |
| Error de memoria (OOM) | Reduce la calidad gráfica en el menú de configuración o usa el preset "bajo" |

---

## ✅ RESUMEN DE CARACTERÍSTICAS IMPLEMENTADAS

- **Una sola base de código** para móvil, tablet y Android TV
- **React + TypeScript + Three.js** conservados íntegramente
- **8 niveles originales** sin modificaciones
- **Audio procedural** (Web Audio API) adaptado a altavoces de TV
- **Progreso persistente** en localStorage (niveles, coleccionables, monedas, récords, configuración)
- **Controles táctiles virtuales** (joystick, salto, giro, arco, pausa, audio) para móvil/tablet
- **Navegación por D-pad y mando Bluetooth** para Android TV
- **Detección automática de tipo de dispositivo**
- **Gestión de rendimiento** (calidad alta/media/baja, resolución dinámica, sombras, partículas)
- **Pantalla de inicio (splash)** con identidad visual de ASTRO NOVA
- **Icono adaptativo Android** y **banner de Android TV**
- **AndroidManifest.xml** configurado para TV (LEANBACK_LAUNCHER, touchscreen no requerido, hardware acelerado)
- **APK universal** para móvil, tablet y TV (un único APK)
- **AAB** para publicación en Google Play Store
- **Funcionamiento sin conexión** (archivos empaquetados localmente)
