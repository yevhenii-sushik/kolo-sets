import { useState } from 'react';
import { X, Copy, Sparkles, FileText, CheckCircle2, Info } from 'lucide-react';

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

export default function ImportCardsModal({
  isOpen,
  onClose,
  onImport
}: ImportCardsModalProps) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onImport(text);
      setText('');
    }
  };

  const copyPrompt = () => {
    // Обновленный промт с акцентом на изучаемый язык
    const prompt = `Создай список слов для изучения в формате CSV (разделитель точка с запятой ";"). 
ВАЖНО: слово и перевод — как обычно, но ОБЪЯСНЕНИЕ, ПРИМЕР и ЧАСТЬ РЕЧИ должны быть строго на изучаемом языке (например, на норвежском).

Формат строки: слово; перевод; описание (на изучаемом); пример (на изучаемом); часть речи (на изучаемом).

Вот список слов: [ВСТАВЬ СВОИ СЛОВА ЗДЕСЬ]`;
    
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay с эффектом размытия */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white/90 dark:bg-gray-900/95 border border-white/20 dark:border-gray-800 rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[90dvh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 text-green-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Импорт слов
              </h2>
              <p className="text-sm text-gray-500">Погружение в язык через контекст</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 grid md:grid-cols-2 gap-8">
          
          {/* Левая колонка: Инструкции и AI */}
          <div className="space-y-6">
            <div className="bg-purple-600/5 dark:bg-purple-500/10 p-6 rounded-[2rem] border border-purple-500/20 shadow-inner">
              <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400 font-bold">
                <Sparkles size={20} />
                <h3>Мастер Промптов</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Используйте AI, чтобы создать правильный контент. Наш промт попросит нейросеть написать описание и примеры <b>только на изучаемом языке</b> для лучшего запоминания.
              </p>
              <button
                onClick={copyPrompt}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-purple-200 dark:border-purple-700 rounded-xl hover:shadow-lg transition-all active:scale-95 font-bold text-sm"
              >
                {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                {copied ? 'Готово к вставке в AI' : 'Копировать AI-промт'}
              </button>
            </div>

            <div className="bg-blue-500/5 dark:bg-blue-500/5 p-6 rounded-[2rem] border border-blue-500/10">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                <Info size={16} className="text-blue-500" />
                Правила формата
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                   <code className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400 block break-all">
                    слово; перевод; описание_на_иностранном; пример_на_иностранном; часть_речи
                   </code>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="text-purple-500 font-bold">1.</span>
                    <span><b>Описание:</b> должно быть на изучаемом языке (объяснение смысла слова).</span>
                  </li>
                  <li className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="text-purple-500 font-bold">2.</span>
                    <span><b>Пример:</b> целое предложение на изучаемом языке.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="text-purple-500 font-bold">3.</span>
                    <span><b>Часть речи:</b> например, "Substantiv" или "Verb" вместо "Сущ".</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Правая колонка: Тестовое поле */}
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 min-h-[350px] relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="skrive; писать; å uttrykke tanker med tegn; Jeg skriver в bok; verb"
                className="w-full h-full p-6 bg-gray-50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2.5rem] focus:border-purple-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-mono text-sm resize-none shadow-inner"
              />
              {text.trim() && (
                <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2">
                   {text.trim().split('\n').length} КАРТОЧЕК ГОТОВО
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-4 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-800 dark:disabled:to-gray-800 text-white rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] font-black disabled:shadow-none"
              >
                Начать импорт
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}