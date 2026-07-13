# Kolo — Android TWA shell

Тонкая Android-обёртка (Trusted Web Activity) вокруг https://kolo.dakuta.dev/.
APK не содержит контента приложения — он просто открывает сайт полноэкранно,
без адресной строки. Весь UI/логика продолжают жить на Netlify: после обычного
`git push` / деплоя сайта контент в уже установленном APK обновляется сам
(через service worker с `registerType: 'autoUpdate'` в `vite-plugin-pwa`).
Пересборка APK ниже нужна **только** если меняются иконка/имя/цвета
приложения, `applicationId` или сама TWA-обвязка — не для обычных фич/фиксов.

## Разово: окружение на машине

```bash
brew install openjdk@17
brew install --cask android-commandlinetools

export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Homebrew кладёт cmdline-tools в cmdline-tools/latest/bin, а Bubblewrap ждёт
# их прямо в $ANDROID_HOME/bin — линкуем:
ln -sfn "$ANDROID_HOME/cmdline-tools/latest/bin" "$ANDROID_HOME/bin"
```

Конфиг Bubblewrap (`~/.bubblewrap/config.json`) — jdkPath **без** `/Contents/Home`
(Bubblewrap сам добавляет этот суффикс на macOS):

```json
{"jdkPath":"/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk","androidSdkPath":"/opt/homebrew/share/android-commandlinetools"}
```

## Keystore

`android.keystore` и `keystore.properties` в этой папке — **не в git**
(см. `.gitignore`). Это единственная копия подписи приложения: потеряете —
не сможете обновить уже установленный APK тем же ключом (только удалить и
поставить заново). Сделайте бэкап обоих файлов в надёжное место (менеджер
паролей, приватное облачное хранилище).

## Пересборка APK/AAB

```bash
cd android-twa
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$JAVA_HOME/bin:$PATH"
export BUBBLEWRAP_KEYSTORE_PASSWORD=$(grep keystorePassword keystore.properties | cut -d= -f2)
export BUBBLEWRAP_KEY_PASSWORD=$(grep keyPassword keystore.properties | cut -d= -f2)

# Если менялись иконки/имя/цвета — перегенерировать twa-manifest.json из
# живого манифеста сайта (не забудьте вручную поднять appVersionCode после):
node generate-manifest.js

npx bubblewrap build --manifest ./twa-manifest.json --directory .
```

Результат: `app-release-signed.apk` (для установки на телефон) и
`app-release-bundle.aab` (для Google Play, если когда-нибудь понадобится).

## Установка на телефон

Через USB с включённой отладкой:

```bash
"$ANDROID_HOME/platform-tools/adb" install -r app-release-signed.apk
```

Либо просто скопировать `app-release-signed.apk` на телефон (AirDrop-аналог,
почта, облако) и открыть — Android спросит разрешение на установку из
неизвестного источника при первом запуске.

## Digital Asset Links (полноэкранный режим без адресной строки)

`public/.well-known/assetlinks.json` в корне сайта подтверждает Chrome, что
именно это APK (по SHA-256 сертификата) владеет доменом kolo.dakuta.dev.
Файл уже закоммичен и должен быть задеплоен вместе с сайтом. Если меняете
keystore — обновите `sha256_cert_fingerprints` в этом файле.
