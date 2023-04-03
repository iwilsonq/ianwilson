export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  let secondsStr = `${seconds}`;
  if (seconds < 10) {
    secondsStr = '0' + seconds;
  }
  return `${minutes}:${secondsStr}`;
}
