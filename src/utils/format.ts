export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function compactPath(path: string, maxLength = 56) {
  if (path.length <= maxLength) {
    return path;
  }

  return `…${path.slice(path.length - maxLength)}`;
}

export function folderNameFromPath(path: string | undefined) {
  if (!path) {
    return '未选择';
  }

  const normalized = path.replace(/[\\/]+$/, '');
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || '本地音乐库';
}
