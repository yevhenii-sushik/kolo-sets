<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="version"/>
<img src="https://img.shields.io/badge/TypeScript-96%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react"/>
<img src="https://img.shields.io/badge/Firebase-Enabled-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="firebase"/>
<img src="https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="netlify"/>
<img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="license"/>

<br/><br/>

```
██╗  ██╗ ██████╗ ██╗      ██████╗     ███████╗███████╗████████╗███████╗
██║ ██╔╝██╔═══██╗██║     ██╔═══██╗    ██╔════╝██╔════╝╚══██╔══╝██╔════╝
█████╔╝ ██║   ██║██║     ██║   ██║    ███████╗█████╗     ██║   ███████╗
██╔═██╗ ██║   ██║██║     ██║   ██║    ╚════██║██╔══╝     ██║   ╚════██║
██║  ██╗╚██████╔╝███████╗╚██████╔╝    ███████║███████╗   ██║   ███████║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝
```

### 🇳🇴 Intelligent Language Learning · Spaced Repetition · Multilingual

**[Live Demo](https://kolo-sets.netlify.app)** · **[Report Bug](https://github.com/yevhenii-sushik/kolo-sets/issues)** · **[Request Feature](https://github.com/yevhenii-sushik/kolo-sets/issues)**

</div>

---

## 📖 About

**Kolo Sets** is a minimalist, high-performance language learning application built around the scientifically proven **SM-2 Spaced Repetition algorithm**. Designed primarily for Norwegian language learners, but extensible to any language pair, it combines the efficiency of flashcard systems with the engagement of gamification — streaks, achievements, and progress tracking.

> *"The most efficient way to learn vocabulary is to see it just before you forget it."*

Kolo Sets puts this principle into practice with a clean, distraction-free interface that gets out of your way and lets you focus on learning.

---

## ✨ Features

### 🧠 Core Learning Engine
- **SM-2 Spaced Repetition** — Battle-tested algorithm that optimizes review intervals based on your performance
- **Flashcard Mode** — Traditional card-flip practice with self-assessment
- **Quiz Mode** — Active recall testing with multiple-choice challenges
- **Adaptive Scheduling** — Cards you struggle with appear more frequently; mastered cards less so

### 🌍 Multilingual Interface
- Full UI in **🇬🇧 English**, **🇳🇴 Norsk**, and **🇷🇺 Русский**
- Instant language switching — no reload required
- i18n-ready architecture for easy addition of new languages

### 🔊 Text-to-Speech (TTS)
- Native pronunciation for **Norwegian Bokmål** and **Nynorsk**
- **English** (US & UK variants)
- Configurable TTS language per deck — hear exactly what you're learning

### 📊 Statistics & Gamification
- **Daily Streaks** — Build and maintain your learning habit
- **13 Achievement Types** — Milestones that celebrate your progress
- **Activity Calendar** — GitHub-style contribution graph of your study sessions
- **Progress Dashboard** — Per-deck mastery percentages, card counts, and session history

### 🎴 Deck Management
- Create, edit, and delete card decks with custom names and descriptions
- **Import / Export JSON** — Backup your decks or share them with others
- Choose TTS language per deck at creation time
- Quick-access Study and Quiz launch from the deck card

### 🎨 UI & UX
- **Dark / Light theme** — Respects system preference, toggleable manually
- **Sound effects** — Subtle audio feedback for correct/incorrect answers and session completion
- Fully responsive — works on mobile, tablet, and desktop
- No PWA complexity — always loads the freshest version

### 🔐 Authentication
- Firebase-powered auth — secure, fast, and scalable
- User profiles with persistent progress across devices

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript (96%+ coverage) |
| **Styling** | Tailwind CSS |
| **Backend / Auth** | Firebase (Auth + Firestore) |
| **Deployment** | Netlify |
| **Linting** | ESLint |
| **i18n** | Custom context-based i18n (`src/utils/i18n.ts`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 18.x`
- **npm** `>= 9.x`
- A Firebase project (for auth and data persistence)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yevhenii-sushik/kolo-sets.git
cd kolo-sets

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in your Firebase credentials in .env

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output is placed in `dist/`. Ready to deploy to Netlify, Vercel, or any static host.

---

## 🔧 Configuration

### Firebase Setup

Create a `.env` file at the root with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Netlify Deployment

The repository includes a `netlify.toml` with SPA redirect rules pre-configured. Simply connect your repository to Netlify — zero additional configuration needed.

---

## 🌐 Internationalization (i18n)

All UI strings live in `src/utils/i18n.ts`. To switch the interface language programmatically:

```tsx
import { useI18n } from '../contexts/I18nContext';

function MyComponent() {
  const { t, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t.home.title}</h1>
      <button onClick={() => setLanguage('no')}>Norsk</button>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('ru')}>Русский</button>
    </div>
  );
}
```

#### i18n Coverage Status

| Screen | Status |
|---|---|
| Home Page | ✅ Complete |
| Navigation (Sidebar + BottomNav) | ✅ Complete |
| Deck Creation | ✅ Complete |
| Deck Cards (Study / Quiz buttons) | ✅ Complete |
| Flashcards & Quiz Pages | 🔄 ~20% |
| Profile | 🔄 ~20% |
| Modal Dialogs | 🔄 ~30% |

---

## 📁 Project Structure

```
kolo-sets/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base design system components
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── I18nContext.tsx  # Multilingual state
│   │   └── ThemeContext.tsx # Dark/light theme
│   ├── pages/               # Route-level page components
│   │   ├── Home.tsx
│   │   ├── Flashcards.tsx
│   │   ├── Quiz.tsx
│   │   └── Profile.tsx
│   ├── utils/
│   │   ├── i18n.ts          # All translation strings (3 languages)
│   │   ├── sm2.ts           # Spaced Repetition SM-2 algorithm
│   │   └── tts.ts           # Text-to-Speech helpers
│   ├── firebase/            # Firebase config and service layer
│   └── main.tsx             # App entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── netlify.toml
```

---

## 🗺️ Roadmap

- [x] SM-2 Spaced Repetition engine
- [x] Firebase authentication & cloud sync
- [x] Dark / Light theme
- [x] Text-to-Speech (Norwegian + English)
- [x] Achievements & streaks
- [x] JSON import / export
- [x] Multilingual UI (EN / NO / RU)
- [ ] Complete i18n coverage (all screens)
- [ ] Social features — friends & leaderboards
- [ ] Public deck sharing
- [ ] Offline support
- [ ] Additional game modes
- [ ] Localized date formatting

---

## 🤝 Contributing

Contributions are welcome and appreciated!

```bash
# Fork the repo and create a feature branch
git checkout -b feature/amazing-feature

# Commit your changes with a descriptive message
git commit -m "feat: add amazing feature"

# Push and open a Pull Request
git push origin feature/amazing-feature
```

Please follow conventional commits and keep PRs focused on a single concern.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

## 👨‍💻 Author

Built with ❤️ by **Euphoria Software**

<div align="center">

---

*If Kolo Sets helps you on your language learning journey, consider giving it a ⭐ — it means a lot!*

</div>