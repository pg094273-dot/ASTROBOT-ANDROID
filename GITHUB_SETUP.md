# 🐙 COMO SUBIR ESTE PROYECTO A GITHUB Y GENERAR EL APK AUTOMÁTICAMENTE

Este proyecto está listo para subirse a GitHub y generar el APK automáticamente mediante **GitHub Actions** (CI/CD). Cada vez que hagas `push` a la rama `main`, se compilará el APK y podrás descargarlo.

---

## PASO 1: CREAR REPOSITORIO EN GITHUB

1. Ve a [github.com](https://github.com) e inicia sesión.
2. Haz clic en **+ → New repository**.
3. Nombre del repositorio: `astro-nova-android` (o el que prefieras).
4. Dejalo **Público** o **Privado** (según prefieras).
5. **NO** marques "Add a README file" (ya tenemos nuestro propio README).
6. **NO** añadas .gitignore ni licencia (ya los tenemos).
3. Haz clic en **Create repository**.

---

## PASO 2: SUBIR EL CÓDIGO

Desde la terminal, en la carpeta del proyecto:

```bash
cd "/Users/usuario/Documents/ASTROBOT ANDROID/Astro-bot-main"

# Si no tienes git inicializado
git init
git add .
git commit -m "feat: Astro Nova 3D Android Capacitor project ready"

# Enlazar con tu repositorio (cambia TU_USUARIO y TU_REPO)
git remote add origin https://github.com/pg094273-dot/ASTROBOT-ANDROID
git branch -M main
git push -u origin main
```

---

## PASO 3: VERIFICAR QUE SE GENERA EL APK

1. Ve a tu repositorio en GitHub.
2. Haz clic en la pestaña **Actions**.
3. Deberías ver el workflow **"Build Android TV APK"** ejecutándose (o ejecutalo manualmente con el botón "Run workflow").
4. Espera a que termine (unos 5-10 minutos).
5. Cuando finalice, haz clic en el run completado.
6. En la sección **Artifacts** (artefactos), descarga `astro-nova-3d-debug-apk`.
   - Ese archivo es el `.apk` listo para instalar en tu dispositivo Android.

---

## PASO 4: INSTALAR EL APK EN TU DISPOSITIVO

### Teléfono / Tablet Android
```bash
adb install -r astro-nova-3d-debug-apk.apk
```
O bien, transfiere el archivo `.apk` al dispositivo e instálalo desde un gestor de archivos.

### Android TV / Google TV
- **Opción ADB:** `adb connect IP_DE_TU_TV:5555 && adb install -r astro-nova-3d-debug-apk.apk`
- **Opción USB:** Copia el APK a un pendrive, conéctalo a la TV e instálalo con un gestor de archivos.
- **Opción Downloader:** Instala la app "Downloader" en la TV, introduce la URL del Release de GitHub e instala.

La app aparecerá en el menú de aplicaciones de la TV (gracias a `LEANBACK_LAUNCHER`).

---

## PASO 5: GENERAR UN RELEASE CON APK FIRMADO (OPCIONAL, PARA GOOGLE PLAY)

Si quieres publicar en Google Play Store o distribuir un APK firmado:

1. Genera un keystore:
   ```bash
   keytool -genkeypair -v -keystore astronova-release.keystore -alias astronova -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Codifícalo en Base64:
   ```bash
   base64 -i astronova-release.keystore > keystore.base64
   ```

3. En GitHub, ve a **Settings → Secrets and variables → Actions → New repository secret** y añade:
   - `KEYSTORE_BASE64`: el contenido de `keystore.base64`
   - `KEYSTORE_PASSWORD`: la contraseña del keystore
   - `KEY_ALIAS`: el alias (ej. `astronova`)
   - `KEY_PASSWORD`: la contraseña de la clave

4. Crea un **Release** en GitHub (Releases → Draft a new release).
   - El workflow `release-apk.yml` se disparará automáticamente.
   - Generará el APK firmado y lo adjuntará al release.

5. Descarga el APK firmado desde la sección **Assets** del release.

---

## ARCHIVOS DE CI/CD INCLUIDOS

| Archivo | Propósito |
|---------|-----------|
| `.github/workflows/build-apk.yml` | Compila APK de debug en cada `push` a `main` y lo sube como artifact |
| `.github/workflows/release-apk.yml` | Compila APK firmado y lo adjunta a un Release de GitHub |
| `.github/workflows/deploy.yml` | Despliega la versión web/PWA a GitHub Pages |

---

## RESUMEN

- ✅ **Sí, se puede generar el APK automáticamente desde GitHub.**
- ✅ No necesitas Android Studio en tu computadora para obtener el APK.
- ✅ Puedes descargar el APK desde la pestaña **Actions** o desde **Releases**.
- ✅ El proyecto está listo para importar a Google AI Studio y compilar desde la nube.
- ✅ Un único APK universal funciona en móvil, tablet y Android TV.
