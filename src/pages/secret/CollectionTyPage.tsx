import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Lock, Sparkles, Droplets, Snowflake, Zap, FlameKindling, Infinity } from 'lucide-react';

// 1. Определение типов и данных
type Rarity = 'Fjord' | 'Frost' | 'Nord' | 'Mist' | 'Eld' | 'Void' | 'Ragnarok';

interface CollectorCard {
  id: string;
  title: string;
  translation: string;
  rarity: Rarity;
  description: string;
  isUnlocked: boolean;
  imageUrl?: string; // Можно добавить изображения артефактов
}

const RARITY_CONFIG: Record<Rarity, { color: string; icon: React.ReactNode; bg: string; text: string }> = {
  Fjord: { color: '#B5B0A8', icon: <Droplets size={14} />, bg: 'bg-subtle ', text: 'text-fg ' },
  Frost: { color: '#60A5FA', icon: <Snowflake size={14} />, bg: 'bg-info-soft ', text: 'text-info ' },
  Nord: { color: '#3B82F6', icon: <Zap size={14} />, bg: 'bg-info ', text: 'text-white' },
  Mist: { color: '#A855F7', icon: <Sparkles size={14} />, bg: 'bg-special ', text: 'text-white' },
  Eld: { color: '#FF5733', icon: <FlameKindling size={14} />, bg: 'bg-accent ', text: 'text-white' },
  Void: { color: '#1A1714', icon: <Infinity size={14} />, bg: 'bg-scrim ', text: 'text-faint' },
  Ragnarok: { color: '#FFFFFF', icon: <Star size={14} />, bg: 'bg-gradient-to-br from-accent via-special to-info', text: 'text-white' },
};

const MOCK_CARDS: CollectorCard[] = [
  { id: 'c1', title: 'Vikingskip', translation: 'Корабль викингов', rarity: 'Fjord', description: 'Обычный драккар, бороздящий воды фьордов.', isUnlocked: true },
  { id: 'c2', title: 'Fjordtroll', translation: 'Тролль фьорда', rarity: 'Fjord', description: 'Озорной, но безобидный обитатель скал.', isUnlocked: true },
  { id: 'c3', title: 'Iskrystall', translation: 'Ледяной кристалл', rarity: 'Frost', description: 'Никогда не тающий осколок вечного льда.', isUnlocked: true },
  { id: 'c4', title: 'Runestein', translation: 'Рунический камень', rarity: 'Frost', description: 'Древний камень с защитными рунами.', isUnlocked: false },
  { id: 'c5', title: 'Nordlys Fragment', translation: 'Фрагмент Северного Сияния', rarity: 'Nord', description: 'Застывший кусочек небесного танца света.', isUnlocked: true },
  { id: 'c6', title: 'Midgardsormen', translation: 'Мидгардсорм', rarity: 'Nord', description: 'Тень великого змея, таящаяся в глубинах.', isUnlocked: false },
  { id: 'c7', title: 'Valhall Nøkkel', translation: 'Ключ от Валгаллы', rarity: 'Mist', description: 'Ключ, открывающий врата в чертог павших.', isUnlocked: true },
  { id: 'c8', title: 'Mjølnir', translation: 'Мьёльнир', rarity: 'Eld', description: 'Молот Тора, сокрушающий врагов Асгарда.', isUnlocked: true },
  { id: 'c9', title: 'Gungnir', translation: 'Гунгнир', rarity: 'Void', description: 'Копье Одина, которое никогда не промахивается.', isUnlocked: true },
  { id: 'c10', title: 'Yggdrasil Frø', translation: 'Семя Иггдрасиля', rarity: 'Ragnarok', description: 'Семя Мирового Древа, начало нового цикла.', isUnlocked: true },
];

// 2. Компонент отдельной карточки
function CollectorCardComponent({ card }: { card: CollectorCard }) {
  const config = RARITY_CONFIG[card.rarity];
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 h-[280px] perspective"
      whileHover={{ y: -5 }}
      onClick={() => card.isUnlocked && setIsFlipped(!isFlipped)}
    >
      <motion.div
        className={`relative w-full h-full transition-transform duration-500 preserve-3d cursor-pointer rounded-4xl border border-line shadow-sm ${config.bg} ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between z-10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ${config.text}`}>
              {config.icon}
              <span className="text-2xs font-semibold uppercase tracking-[0.15em] opacity-80">{card.rarity}</span>
            </div>
            {!card.isUnlocked && <Lock size={16} className="text-faint" />}
          </div>

          <div className={!card.isUnlocked ? 'opacity-20' : ''}>
            <h3 className={`font-display leading-tight text-2xl ${config.text}`}>
              {card.isUnlocked ? card.title : '???'}
            </h3>
            <p className={`text-sm font-medium italic mt-1 ${config.text} opacity-70`}>
              {card.isUnlocked ? card.translation : 'Hidden Artifact'}
            </p>
          </div>
          
          {/* Decorative Sparkle for Rare+ unlocked cards */}
          {card.isUnlocked && (card.rarity !== 'Fjord' && card.rarity !== 'Frost') && (
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
        
              className="absolute bottom-6 right-6 text-white/40"
            >
              <Sparkles size={24} />
            </motion.div>
          )}
        </div>

        {/* Back of Card (Description) */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-center items-center text-center ${config.bg} rounded-4xl`}>
            <p className={`text-xs leading-relaxed ${config.text}`}>
                {card.description}
            </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 3. Главный компонент страницы
export default function CollectionTyPage() {
  const unlockedCount = MOCK_CARDS.filter(c => c.isUnlocked).length;
  const totalCount = MOCK_CARDS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pb-32 pt-6 space-y-8 px-6"
    >
      {/* Header Bento Block */}
      <div className="grid grid-cols-12 gap-6 bg-surface p-8 rounded-4xl border border-line">
        <div className="col-span-12 md:col-span-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent-soft rounded-full flex items-center justify-center text-accent-ink">
              <Star size={20} fill="#FF5733" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.06em] text-fg">
              Artifact <span className="font-display text-muted">Collection</span>
            </h1>
          </div>
          <p className="text-lg text-muted max-w-2xl font-medium font-display mb-6">
            Mestre norsk og samle unike gjenstander. Hvert ord tar deg nærmere Ragnarok.
          </p>
        </div>
        
        <div className="col-span-12 md:col-span-4 flex flex-col justify-center items-center bg-subtle rounded-4xl p-6 text-center">
            <div className="text-5xl font-bold text-accent-ink">{unlockedCount} / {totalCount}</div>
            <p className="text-2xs font-semibold uppercase tracking-[0.1em] mt-2 text-faint">
                Artifacts Unlocked
            </p>
             <div className="w-full h-2 bg-surface/50 rounded-full mt-4 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-accent"
                />
            </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-12 gap-6">
        <AnimatePresence>
          {MOCK_CARDS.map((card) => (
            <CollectorCardComponent key={card.id} card={card} />
          ))}
        </AnimatePresence>
      </div>

      {/* Фоновые элементы */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/10 w-72 h-72 bg-special/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/5 right-1/10 w-96 h-96 bg-accent/5 rounded-full blur-[120px]"></div>
      </div>
    </motion.div>
  );
}