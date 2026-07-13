// Генерирует twa-manifest.json из живого PWA-манифеста сайта.
// Запуск: node generate-manifest.js
const { TwaManifest } = require('@bubblewrap/core');

const WEB_MANIFEST_URL = 'https://kolo.dakuta.dev/manifest.webmanifest';
const PACKAGE_ID = 'dev.dakuta.kolo';

async function main() {
  const twaManifest = await TwaManifest.fromWebManifest(WEB_MANIFEST_URL);

  twaManifest.packageId = PACKAGE_ID;
  twaManifest.signingKey = { path: './android.keystore', alias: 'kolo' };
  twaManifest.appVersionCode = 1;
  twaManifest.appVersionName = '1';

  await twaManifest.saveToFile('./twa-manifest.json');
  console.log('twa-manifest.json written for', twaManifest.host);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
