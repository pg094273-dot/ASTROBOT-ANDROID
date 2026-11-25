# 📥 COMO IMPORTAR ESTE PROYECTO A GOOGLE AI STUDIO

Esta guía explica cómo importar el proyecto ASTRO NOVA Android a Google AI Studio (Project IDX / entorno de desarrollo basado en la nube de Google) para editar, compilar y generar el APK.

---

## 1. SUBIR EL PROYECTO A GITHUB (PASO PREVIO)

Google AI Studio puede importar proyectos directamente desde un repositorio de GitHub. Primero sube este proyecto:

```bash
cd "/Users/usuario/Documents/ASTROBOT ANDROID/Astro-bot-main"

# Inicializar git (si aún no está inicializado)
git init
git add .
git commit -m "feat: Astro Nova 3D Android Capacitor project ready"

# Crear repositorio en GitHub (web: github.com → New repository)
# Luego enlazar y subir:
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

> **Importante:** Antes de subir, asegúrate de que el archivo `.gitignore` esté presente (ya está incluido en este proyecto) para no subir `node_modules/`, `dist/` ni keystores privados.

---

## 2. IMPORTAR DESDE GOOGLE AI STUDIO

1. Abre [Google AI Studio](https://ai.studio) (o Project IDX: https://idx.google.com).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **"New Project"** / **"Import from GitHub"**.
4. Pega la URL de tu repositorio:
   ```
   https://github.com/TU_USUARIO/TU_REPO.git
   ```
5. Selecciona la rama `main`.
6. AI Studio clonará el repositorio y detectará automáticamente que es un proyecto Node.js + Capacitor + Android.

---

## 3. CONFIGURACIÓN EN GOOGLE AI STUDIO

Una vez importado, AI Studio te ofrece un entorno de desarrollo con terminal. Ejecuta estos comandos en la terminal integrada:

### 3.1 Instalar dependencias
```bash
npm install
```

### 3.2 Construir el juego web (Vite)
```bash
npm run build
```

### 3.3 Sincronizar con Capacitor (Android)
```bash
npx cap sync android
```

### 3.4 Generar el APK
Necesitas Java y Android SDK. En AI Studio, instala Android SDK si no está presente:

```bash
# Verificar Java
java -version

# Dar permisos al wrapper de Gradle
chmod +x android/gradlew

# Generar APK de debug
cd android
./gradlew assembleDebug
```

El APK se generará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 3.5 Descargar el APK
En la barra lateral de archivos de AI Studio, navega a:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
Haz clic derecho → **Download** para descargarlo a tu computadora.

---

## 4. GENERACIÓN AUTOMÁTICA DE APK DESDE GITHUB (ALTERNATIVA)

Si no quieres compilar manualmente en AI Studio, este proyecto incluye workflows de **GitHub Actions** que compilan el APK automáticamente cada vez que haces `push` a la rama `main`.

Los archivos de workflow están en:
- `.github/workflows/build-apk.yml` — Compila APK de debug y lo sube como artifact
- `.github/workflows/release-apk.yml` — Compila APK firmado y lo adjunta a un Release de GitHub
- `.github/workflows/deploy.yml` — Despliega la versión web a GitHub Pages

### Cómo descargar el APK desde GitHub:

1. Sube el código a GitHub.
2. Ve a la pestaña **Actions** de tu repositorio.
3. Selecciona el workflow **"Build Android TV APK"**.
4. Haz clic en el último run exitoso.
5. En **Artifacts**, descarga `astro-nova-3d-debug-apk`.

O bien, si creas un Release (versión etiquetada), el APK firmado quedará adjunto en la sección **Releases** de tu repositorio.

---

## 5. CONFIGURAR SECRETOS PARA FIRMAR EL APK (OPCIONAL)

Para generar un APK firmado (listo para Google Play Store), configura estos secretos en GitHub:

Ve a **Settings → Secrets and variables → Actions** de tu repositorio y añade:

| Secreto | Valor |
|---------|-------|
| `KEYSTORE_BASE64` | Tu keystore codificado en Base64 (`base64 -i astronova-release.keystore`) |
| `KEYSTORE_PASSWORD` | Contraseña del keystore |
| `KEY_ALIAS` | Alias de la clave |
| `KEY_PASSWORD` | Contraseña de la clave |

Luego, crea un Release en GitHub para que se genere el APK firmado automáticamente.

---

## 6. ESTRUCTURA DEL PROYECTO (para AI Studio)

```
Astro-bot-main/
├── .github/workflows/          # CI/CD: build APK, release, deploy
├── src/                        # Código fuente React + TypeScript + Three.js
│   ├── components/             # UI: HUD, Menús, Controles táctiles, Splash, TV
│   ├── game/                   # Motor: Engine, niveles, audio, física, texturas
│   ├── hooks/                  # Detección dispositivo, gamepad, PWA
│   ├── contexts/               # Contexto dispositivo (móvil/tablet/TV)
│   ├── App.tsx                 # Punto de entrada
│   └── main.tsx                # Renderizador React
├── android/                    # Proyecto nativo Android (Capacitor)
│   ├── app/src/main/AndroidManifest.xml
│   ├── app/build.gradle
│   └── assets/public/          # Archivos web del juego (copiados por Capacitor)
├── capacitor.config.ts         # Configuración Capacitor
├── vite.config.ts              # Configuración Vite
├── package.json                # Dependencias npm
├── INSTRUCCIONES_ANDROID.md    # Guía completa de compilación local
├── GOOGLE_AI_STUDIO_IMPORT.md  # Esta guía
└── README.md                   # Documentación del juego
```

---

## 7. SOLUCIÓN DE PROBLEMAS EN AI STUDIO

| Problema | Solución |
|----------|----------|
| `./gradlew: permiso denegado` | Ejecuta `chmod +x android/gradlew` |
| `SDK location not found` | Instala Android SDK en AI Studio o configura `ANDROID_HOME` |
| `node_modules no encontrado` | Ejecuta `npm install` |
| El APK no se genera | Revisa los logs de Gradle en la terminal de AI Studio |

---

## 8. PRUEBA EL JUEGO

Una vez instalado el APK en tu dispositivo Android (teléfono, tablet o Android TV):

1. Abre la app **Astro Nova 3D**.
2. Verifica que aparecen los **8 niveles** en el menú principal.
3. Prueba los controles táctiles (móvil/tablet) o el mando (TV).
4. Verifica que el sonido, colisiones y guardado funcionan.
