import { createHash } from 'crypto';

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT || 'drawing-faces-salt')).digest('hex').slice(0, 16);
}

export function anonymousName(ipHash: string): string {
  const adjectives = [
    'silver', 'amber', 'crimson', 'indigo', 'golden', 'cobalt', 'russet',
    'ivory', 'velvet', 'jade', 'onyx', 'scarlet', 'tawny', 'ashen', 'bronze',
    'umber', 'lilac', 'slate', 'pearl', 'ochre',
  ];
  const animals = [
    'fox', 'wolf', 'hawk', 'bear', 'lynx', 'crane', 'elk', 'owl',
    'raven', 'heron', 'bison', 'deer', 'finch', 'otter', 'wren',
    'ibis', 'vole', 'mink', 'kite', 'swift',
  ];

  const h1 = parseInt(ipHash.slice(0, 8), 16);
  const h2 = parseInt(ipHash.slice(8, 16), 16);

  return `${adjectives[h1 % adjectives.length]} ${animals[h2 % animals.length]}`;
}
