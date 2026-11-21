// Отдать готовую картинку: системное меню «Поделиться» (телефоны, Safari, Chrome на Windows),
// скачивание файла и копирование в буфер (удобно на компьютере: вставить в чат или пост)

export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

// navigator.share должен вызываться прямо из нажатия: поэтому файл готовим заранее, а не по клику.
// Только файл, без текста: на iOS с текстом часть приложений получает одну подпись без картинки.
// Адрес Kolo и так есть на самой картинке
export async function shareFile(file: File): Promise<"shared" | "cancelled"> {
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (err) {
    // Человек закрыл меню — это не ошибка
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    throw err;
  }
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari начинает скачивание не сразу — ссылку отзываем с запасом
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function canCopyImage(): boolean {
  return typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";
}

export async function copyImage(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
