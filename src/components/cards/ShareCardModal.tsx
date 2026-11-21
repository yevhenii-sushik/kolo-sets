import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { Card } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { courseName } from "../../courses/languages";
import { posLabel } from "../../data/partsOfSpeech";
import { PALETTES, SHARE_STYLES, ShareStyle, renderCardImage } from "../../share/cardImage";
import { canCopyImage, canShareFile, copyImage, downloadFile, shareFile } from "../../share/shareFile";
import { Alert, Button, Modal, Skeleton, cx } from "../../ui";

const STYLE_KEY = "kolo_share_style";

// Последнее выбранное оформление — удобство этого устройства, не данные
function readStyle(): ShareStyle {
  try {
    const saved = localStorage.getItem(STYLE_KEY);
    return SHARE_STYLES.includes(saved as ShareStyle) ? (saved as ShareStyle) : "light";
  } catch {
    return "light";
  }
}

function saveStyle(style: ShareStyle) {
  try {
    localStorage.setItem(STYLE_KEY, style);
  } catch {
    // Без хранилища просто не запоминаем выбор
  }
}

// kolo-hund.png, kolo-собака.png; без букв в слове — kolo-card.png
function fileName(word: string): string {
  const slug = word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return `kolo-${slug || "card"}.png`;
}

interface ShareCardModalProps {
  card: Card | null;
  courseId: string; // язык набора — плашка на картинке
  onClose: () => void;
}

// «Поделиться словом»: карточка картинкой для соцсетей и мессенджеров. Превью сразу, оформление на выбор,
// дальше системное меню «Поделиться», скачивание или копирование
export default function ShareCardModal({ card, courseId, onClose }: ShareCardModalProps) {
  const { t } = useI18n();
  return (
    <Modal open={card !== null} onClose={onClose} title={t.words.share.title}>
      {card && <ShareCardBody card={card} courseId={courseId} />}
    </Modal>
  );
}

function ShareCardBody({ card, courseId }: { card: Card; courseId: string }) {
  const { t, language } = useI18n();
  const s = t.words.share;
  const locale = getLanguageInfo(language).htmlLang;
  const [style, setStyle] = useState<ShareStyle>(readStyle);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const urlRef = useRef<string | null>(null);

  const pos = card.partOfSpeech ? posLabel(card.partOfSpeech, t.words.pos) : "";
  const languageName = courseName(courseId, locale);

  // Картинка готовится заранее: системное меню «Поделиться» открывается только прямо из нажатия
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    renderCardImage(
      {
        word: card.word,
        translation: card.translation,
        partOfSpeech: pos,
        explanation: card.explanation,
        example: card.example,
        language: languageName,
      },
      style,
    )
      .then((blob) => {
        if (cancelled) return;
        const file = new File([blob], fileName(card.word), { type: "image/png" });
        const url = URL.createObjectURL(file);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setImage({ file, url });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [card.word, card.translation, card.explanation, card.example, pos, languageName, style]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const pick = (next: ShareStyle) => {
    setStyle(next);
    saveStyle(next);
  };

  const canShare = image !== null && canShareFile(image.file);
  const canCopy = canCopyImage();

  const share = async () => {
    if (!image) return;
    try {
      await shareFile(image.file);
    } catch {
      // Меню не открылось (запрет браузера, нет приложений) — отдаём файлом
      downloadFile(image.file);
    }
  };

  const copy = async () => {
    if (!image) return;
    try {
      await copyImage(image.file);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      downloadFile(image.file);
    }
  };

  return (
    <div className="grid gap-5">
      {/* Ширина ограничена и высотой экрана: на маленьком телефоне кнопки остаются видны без прокрутки */}
      <div className="relative mx-auto aspect-[4/5] w-[min(100%,20rem,38dvh)] overflow-hidden rounded-3xl border border-line bg-inset shadow-md">
        {image ? (
          <img src={image.url} alt={s.alt.replace("{word}", card.word)} className="h-full w-full object-cover" />
        ) : (
          !failed && <Skeleton className="h-full w-full" />
        )}
      </div>

      {failed && <Alert>{s.error}</Alert>}

      <section className="grid gap-2">
        <p className="text-sm font-semibold text-fg">{s.style}</p>
        <div role="radiogroup" aria-label={s.style} className="grid grid-cols-3 gap-2">
          {SHARE_STYLES.map((option) => {
            const active = option === style;
            const p = PALETTES[option];
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pick(option)}
                className={cx(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  active ? "border-accent bg-accent-soft" : "border-transparent bg-inset hover:border-accent/40",
                )}
              >
                {/* Образец — цвета самой картинки, поэтому не токены */}
                <span className="relative grid h-9 w-9 place-items-center rounded-full border border-line" style={{ background: p.bg }} aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
                </span>
                <span className="text-xs font-semibold text-fg">{s.styles[option]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-2">
        {canShare && (
          <Button size="lg" fullWidth iconLeft={<Share2 size={18} />} onClick={share}>
            {s.share}
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            variant={canShare ? "secondary" : "primary"}
            size={canShare ? "md" : "lg"}
            fullWidth
            disabled={!image}
            iconLeft={<Download size={18} />}
            onClick={() => image && downloadFile(image.file)}
          >
            {s.download}
          </Button>
          {canCopy && (
            <Button
              variant="secondary"
              size={canShare ? "md" : "lg"}
              fullWidth
              disabled={!image}
              iconLeft={copied ? <Check size={18} /> : <Copy size={18} />}
              onClick={copy}
            >
              {copied ? s.copied : s.copy}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
