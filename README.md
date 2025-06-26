# EasyJapaneseReading

> **Note:** This app was generated and iteratively improved with the help of AI (GitHub Copilot).

A web app for reading Japanese kanji easily, featuring:
- Input of Japanese text with automatic furigana (hiragana) above kanji
- Word search and Japanese→English translation
- Audio pronunciation for words and paragraphs (Google TTS)
- Flashcard system for vocabulary review
- Responsive, user-friendly UI

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/App
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features
- **Furigana Display:** Enter Japanese text and click "Add Furigana" to see kanji with hiragana above.
- **Word Search & Translation:** Click any word or use the search box to get Japanese→English translation.
- **Audio Pronunciation:** Play audio for the whole paragraph or any word (Google TTS, CORS-safe).
- **Flashcards:** Review vocabulary with a built-in flashcard system.

## Notes
- No API keys required. All features use free/open-source libraries and public APIs.
- Audio uses a backend proxy to Google TTS to avoid CORS issues and character limits.
- Works on desktop and mobile browsers.

## Customization
- Edit `src/app/page.tsx` to change UI or logic.
- Edit `src/app/api/jisho/route.ts` for dictionary API logic.
- Edit `src/app/api/tts.ts` for TTS proxy logic.

## Deployment
You can deploy this app to [Vercel](https://vercel.com/) or any platform that supports Next.js.

## License
MIT License. See [LICENSE](LICENSE) for details.

---

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font).
