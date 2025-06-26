'use client'

import React, { useState, useRef } from "react";
import kuromoji, { IpadicFeatures, Tokenizer } from "kuromoji";
import * as wanakana from "wanakana";
import axios from "axios";
import FlashcardSystem from "./FlashcardSystem";

export default function Home() {
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState<IpadicFeatures[]>([]);
  const [search, setSearch] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackController = useRef<{ playing: boolean }>({ playing: false });

  // Build kuromoji tokenizer on demand
  const buildTokenizer = async (): Promise<Tokenizer<IpadicFeatures>> => {
    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: "/dict/" }).build((err: Error | null, tokenizer?: Tokenizer<IpadicFeatures>) => {
        if (err || !tokenizer) reject(err);
        else resolve(tokenizer);
      });
    });
  };

  // Analyze input and set tokens with furigana
  const analyzeText = async () => {
    setLoading(true);
    const tokenizer = await buildTokenizer();
    const result = tokenizer.tokenize(input);
    setTokens(result);
    setLoading(false);
    setTranslation(null);
    setAudioUrl(null);
    // Build flashcards: unique words with reading and meaning
    const uniqueWords = Array.from(new Set(result.map(t => t.surface_form)));
    const flashcardPromises = uniqueWords.map(async (word) => {
      const token = result.find(t => t.surface_form === word);
      let meaning = "";
      try {
        const res = await axios.get(`/api/jisho?keyword=${encodeURIComponent(word)}`);
        let dataArr;
        if (res.data.Content) {
          const contentObj = JSON.parse(res.data.Content);
          dataArr = contentObj.data;
        } else if (res.data.data) {
          dataArr = res.data.data;
        } else {
          try {
            const parsed = JSON.parse(res.data);
            dataArr = parsed.data;
          } catch {
            dataArr = [];
          }
        }
        if (dataArr && dataArr.length > 0) {
          meaning = dataArr[0].senses[0].english_definitions.join(", ");
        }
      } catch {}
      return {
        word,
        reading: token?.reading ? wanakana.toHiragana(token.reading) : word,
        meaning,
      };
    });
    const cards = await Promise.all(flashcardPromises);
    setFlashcards(cards.filter(card => card.meaning));
  };

  // Search and translate a word
  const handleSearch = async (word: string) => {
    setSearch(word);
    setTranslation(null);
    setAudioUrl(null);
    try {
      const res = await axios.get(
        `/api/jisho?keyword=${encodeURIComponent(word)}`
      );
      let dataArr;
      if (res.data.Content) {
        const contentObj = JSON.parse(res.data.Content);
        dataArr = contentObj.data;
      } else if (res.data.data) {
        dataArr = res.data.data;
      } else {
        try {
          const parsed = JSON.parse(res.data);
          dataArr = parsed.data;
        } catch {
          dataArr = [];
        }
      }
      let found = null;
      if (dataArr && dataArr.length > 0) {
        found = dataArr.find(
          (item: any) =>
            item.slug === word ||
            (item.japanese && item.japanese.some((j: any) => j.word === word || j.reading === word))
        );
        if (!found) found = dataArr[0];
        setTranslation(found.senses[0].english_definitions.join(", "));
        // Audio pronunciation using Google TTS via backend proxy
        const reading = found.japanese[0]?.reading || word;
        // console.log('Audio play:', reading);
        const ttsUrl = `/api/tts?text=${encodeURIComponent(reading)}`;
        setAudioUrl(ttsUrl);
      } else {
        setTranslation("No translation found.");
      }
    } catch (e) {
      setTranslation("No translation found.");
    }
  };

  // Helper: Split text into <=200 char chunks, prefer splitting at punctuation
  function splitTextForTTS(text: string, maxLen = 200): string[] {
    const result: string[] = [];
    let remaining = text;
    const re = /([。！？!?.]\s*)/g; // Japanese/English sentence enders
    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        result.push(remaining);
        break;
      }
      let idx = -1;
      let lastMatch = 0;
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(remaining)) !== null) {
        if (match.index + match[0].length > maxLen) break;
        lastMatch = match.index + match[0].length;
      }
      if (lastMatch === 0) {
        // No suitable punctuation, hard split
        result.push(remaining.slice(0, maxLen));
        remaining = remaining.slice(maxLen);
      } else {
        result.push(remaining.slice(0, lastMatch));
        remaining = remaining.slice(lastMatch);
      }
    }
    return result;
  }

  return (
    <div className="w-full" ref={containerRef}>
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        My Japanese Learning Tools
      </h1>
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-blue-400 bg-white/80"
        rows={4}
        placeholder="日本語の文章を入力してください..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex items-center gap-2 mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
          onClick={analyzeText}
          disabled={loading || !input.trim()}
        >
          {loading ? "Analyzing..." : "Add Furigana"}
        </button>
        <button
          className={`bg-gray-200 hover:bg-blue-200 text-blue-600 px-5 py-2 rounded-lg shadow transition flex items-center gap-1 ${isPlaying ? 'bg-blue-100' : ''}`}
          title={isPlaying ? 'Stop audio' : 'Play audio for whole paragraph'}
          style={{ minWidth: 40 }}
          onClick={async () => {
            if (isPlaying) {
              playbackController.current.playing = false;
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              setIsPlaying(false);
              return;
            }
            if (input.trim()) {
              const chunks = splitTextForTTS(input.trim(), 200);
              playbackController.current.playing = true;
              setIsPlaying(true);
              for (let i = 0; i < chunks.length; i++) {
                if (!playbackController.current.playing) break;
                const ttsUrl = `/api/tts?text=${encodeURIComponent(chunks[i])}`;
                try {
                  const audio = new window.Audio(ttsUrl);
                  audioRef.current = audio;
                  await new Promise<void>((resolve, reject) => {
                    audio.onended = () => resolve();
                    audio.onpause = () => resolve();
                    audio.onerror = () => resolve();
                    audio.play();
                  });
                } catch (err) {
                  // skip to next chunk
                }
                if (!playbackController.current.playing) break;
              }
              setIsPlaying(false);
              playbackController.current.playing = false;
            }
          }}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9.75L7.5 12H4.5a.75.75 0 00-.75.75v3a.75.75 0 00.75.75h3l3.75 2.25V9.75zm0 0V6.75A2.25 2.25 0 0113.5 4.5v15a2.25 2.25 0 01-2.25-2.25v-3" />
            </svg>
          )}
          {/* <span className="text-xs font-medium">Paragraph</span> */}
        </button>
      </div>
      {tokens.length > 0 && (
        <div className="mb-8 relative">
          <h2 className="font-semibold mb-2 text-lg text-gray-700">Text with Furigana</h2>
          <div className="flex flex-wrap gap-2 text-2xl bg-gray-50 rounded-lg p-4 border border-gray-200"
            style={{ alignItems:'baseline', lineHeight: '1.5' }}>
            {tokens.map((token, idx) => (
              <span
                key={idx}
                className={`cursor-pointer hover:bg-blue-100 px-1 rounded transition`}
                onClick={() => handleSearch(token.surface_form)}
              >
                {token.surface_form.match(/[一-龯々]/) ? (
                  <ruby>
                    {token.surface_form}
                    <rt className="text-base text-blue-500">
                      {wanakana.toHiragana(
                        token.reading || token.surface_form
                      )}
                    </rt>
                  </ruby>
                ) : (
                  <ruby>{token.surface_form}</ruby>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mb-4 flex gap-2 items-center">
        <button
          className="bg-gray-200 hover:bg-blue-200 text-blue-600 px-3 py-2 rounded-lg shadow transition"
          title="Play audio for search word"
          style={{ minWidth: 40 }}
          onClick={async () => {
            if (search.trim()) {
              const ttsUrl = `/api/tts?text=${encodeURIComponent(search)}`;
              try {
                const audio = new window.Audio(ttsUrl);
                audio.play();
              } catch (err) {
                alert('Failed to play audio.');
              }
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9.75L7.5 12H4.5a.75.75 0 00-.75.75v3a.75.75 0 00.75.75h3l3.75 2.25V9.75zm0 0V6.75A2.25 2.25 0 0113.5 4.5v15a2.25 2.25 0 01-2.25-2.25v-3" />
          </svg>
        </button>
        <input
          className="border border-gray-300 rounded-lg p-2 flex-1"
          placeholder="Search word in paragraph..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
          onClick={() => handleSearch(search)}
          disabled={!search.trim()}
        >
          Translate
        </button>
      </div>
      {/* Translation always at bottom */}
      {translation && (
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-base flex items-center gap-3">
          <strong>Translation:</strong> {translation}
        </div>
      )}
      {/* Flashcard system */}
      <FlashcardSystem cards={flashcards} />
      <div className="text-xs text-gray-400 mt-8 text-center">
        This app uses the following APIs and open datasets:<br />
        • <b>kuromoji.js</b> (Japanese morphological analysis)<br />
        • <b>wanakana</b> (kana/romaji conversion)<br />
        • <b>Jisho.org/CC-CEDICT</b> (Japanese-Chinese/English dictionary)<br />
        • <b>Google TTS</b> (audio pronunciation, via backend proxy)
      </div>
    </div>
  );
}
