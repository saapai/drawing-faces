import { createHash } from 'crypto';

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip + process.env.IP_SALT || 'drawing-faces-salt').digest('hex').slice(0, 16);
}

export function anonymousName(ipHash: string): string {
  const adjectives = [
    'coastal', 'quiet', 'amber', 'morning', 'distant', 'silver', 'hollow',
    'wandering', 'still', 'faded', 'open', 'gentle', 'deep', 'pale', 'soft',
    'late', 'early', 'clear', 'slow', 'warm', 'cold', 'dim', 'bright', 'lone'
  ];
  const nouns = [
    'fog', 'oak', 'tide', 'field', 'ink', 'stone', 'pine', 'reed',
    'hill', 'dust', 'rain', 'wind', 'cliff', 'lake', 'path', 'light',
    'creek', 'drift', 'peak', 'shade', 'brook', 'mist', 'dusk', 'dawn'
  ];

  const h1 = parseInt(ipHash.slice(0, 8), 16);
  const h2 = parseInt(ipHash.slice(8, 16), 16);

  const adj = adjectives[h1 % adjectives.length];
  const noun = nouns[h2 % nouns.length];

  return `${adj} ${noun}`;
}
