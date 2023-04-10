export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const afterHoursRemainingSeconds = Math.floor(seconds % 3600);
  const minutes = Math.floor(afterHoursRemainingSeconds / 60);
  const afterMinutesRemainingSeconds = Math.floor(seconds % 60);

  if (hours) {
    return `${hours}:${padDigits(minutes)}:${padDigits(
      afterMinutesRemainingSeconds
    )}`;
  }

  return `${minutes}:${padDigits(afterMinutesRemainingSeconds)}`;
}

function padDigits(num: number): string {
  if (num < 10) {
    return num.toString().padStart(2, '0');
  }

  return num.toString();
}
