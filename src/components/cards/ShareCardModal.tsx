import { Card } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { courseName } from "../../courses/languages";
import { posLabel } from "../../data/partsOfSpeech";
import { CardImageContent, renderCardImage } from "../../share/cardImage";
import { ShareImagePanel } from "../share/ShareImagePanel";
import { Modal } from "../../ui";

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

// «Поделиться словом»: карточка картинкой для соцсетей и мессенджеров (превью и кнопки — ShareImagePanel)
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
  const locale = getLanguageInfo(language).htmlLang;

  const content: CardImageContent = {
    word: card.word,
    translation: card.translation,
    partOfSpeech: card.partOfSpeech ? posLabel(card.partOfSpeech, t.words.pos) : "",
    explanation: card.explanation,
    example: card.example,
    language: courseName(courseId, locale),
  };

  return (
    <ShareImagePanel
      render={(style) => renderCardImage(content, style)}
      renderKey={JSON.stringify(content)}
      fileName={fileName(card.word)}
      alt={t.words.share.alt.replace("{word}", card.word)}
    />
  );
}
