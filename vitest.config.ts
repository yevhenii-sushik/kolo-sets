import { configDefaults, defineConfig } from "vitest/config";

// Обычные тесты — чистая логика. Тесты *.emu.test.ts идут только на эмуляторах Firebase:
// npm run test:emu (firebase emulators:exec выставляет FIRESTORE_EMULATOR_HOST)
const onEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

export default defineConfig({
  test: {
    include: onEmulator ? ["**/*.emu.test.ts"] : ["**/*.test.ts"],
    exclude: [...configDefaults.exclude, ...(onEmulator ? [] : ["**/*.emu.test.ts"])],
    fileParallelism: !onEmulator,
  },
});
