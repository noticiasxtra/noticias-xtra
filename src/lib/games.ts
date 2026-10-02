/* Juegos Xtra: the list shown on /juegos, in the home strip pop-out and in the games teaser.
   Every game runs in the reader's browser; progress is kept only on their device.
   `cat` groups games on the games page. */
export const GAMES = [
  { id: 'trivia', name: 'Trivia Xtra', icon: '?', color: '#2B1185', cat: 'palabras', about: 'Una pregunta diaria sobre Puerto Rico.' },
  { id: 'palabra', name: 'Palabra Xtra', icon: 'Ñ', color: '#1F90DA', cat: 'palabras', about: 'Adivina la palabra del día en seis intentos.' },
  { id: 'sopa', name: 'Sopa de letras', icon: 'A', color: '#C2410C', cat: 'palabras', about: 'Busca seis palabras bien boricuas.' },
  { id: 'sudoku', name: 'Sudoku del día', icon: '9', color: '#7C3AED', cat: 'mente', about: 'Un sudoku nuevo cada día, en tres niveles.' },
  { id: 'memoria', name: 'Memoria Boricua', icon: '◆', color: '#0E8A5F', cat: 'mente', about: 'Encuentra las parejas en la menor cantidad de jugadas.' },
  { id: 'domino', name: 'Dominó', icon: '⚃', color: '#14111F', cat: 'mesa', about: 'Doble seis contra la computadora. Partida a 100.' },
  { id: 'cuatro-colores', name: 'Cuatro Colores', icon: '+4', color: '#D7263D', cat: 'mesa', about: 'Combina color o número y quédate sin cartas primero.' },
  { id: 'cuatro-en-linea', name: 'Cuatro en Línea', icon: '●', color: '#E8A400', cat: 'mesa', about: 'Conecta cuatro fichas antes que la computadora.' },
] as const;

export const GAME_CATS = [
  { id: 'palabras', name: 'Palabras y trivia' },
  { id: 'mente', name: 'Para la mente' },
  { id: 'mesa', name: 'Mesa y cartas' },
] as const;

/** The featured "game of the day" changes every day (Puerto Rico date) */
export function gameOfTheDay(now = Date.now()) {
  const day = Math.floor((now - 4 * 3600e3) / 86400e3);
  return GAMES[day % GAMES.length];
}
