/** Map stored child avatar keys to a single emoji for the profile picker / header. */
export function childAvatarToEmoji(avatar: string | null | undefined): string {
  const key = (avatar ?? 'bear').toLowerCase();
  const map: Record<string, string> = {
    bear: '🐻',
    fox: '🦊',
    tiger: '🐯',
    panda: '🐼',
    bunny: '🐰',
    owl: '🦉',
    lion: '🦁',
  };
  return map[key] ?? '🧒';
}
