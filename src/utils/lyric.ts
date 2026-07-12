import type { LyricLine } from '../types/music';

const timePattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
const inlineTranslationPattern = /^(.*?)\s*[\(（]\s*(?:翻译|translation|trans)\s*[:：]\s*(.*?)\s*[\)）]\s*$/i;

function formatLyricText(text: string) {
  const translationMatch = text.match(inlineTranslationPattern);
  if (!translationMatch) {
    return text;
  }

  const original = translationMatch[1].trim();
  const translation = translationMatch[2].trim();

  if (!original || !translation) {
    return text;
  }

  return `${original}\n${translation}`;
}

export function parseLrc(content: string): LyricLine[] {
  const lines: LyricLine[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const text = rawLine.replace(timePattern, '').trim();
    const matches = [...rawLine.matchAll(timePattern)];

    if (!matches.length || !text) {
      continue;
    }

    for (const match of matches) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3] ? Number(match[3].padEnd(3, '0')) / 1000 : 0;

      if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
        continue;
      }

      lines.push({
        time: minutes * 60 + seconds + fraction,
        text: formatLyricText(text),
      });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export function parsePlainLyric(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^\[[^\]]+\]\s*/, '').trim())
    .filter(Boolean);
}

export function getActiveLyricIndex(lines: LyricLine[], currentTime: number) {
  if (!lines.length) {
    return -1;
  }

  let activeIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time <= currentTime + 0.15) {
      activeIndex = index;
    } else {
      break;
    }
  }

  return activeIndex;
}
