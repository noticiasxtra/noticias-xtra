/* Juegos Xtra: the list shown on /juegos and in the home strip pop-out.
   Every game runs in the reader's browser; progress is kept only on their device. */
export const GAMES = [
  { id: 'trivia', name: 'Trivia Xtra', icon: '?', color: '#2B1185', about: 'Una pregunta diaria sobre Puerto Rico.' },
  { id: 'palabra', name: 'Palabra Xtra', icon: 'Ñ', color: '#1F90DA', about: 'Adivina la palabra del día en seis intentos.' },
  { id: 'memoria', name: 'Memoria Boricua', icon: '◆', color: '#0E8A5F', about: 'Encuentra las parejas en la menor cantidad de jugadas.' },
  { id: 'sopa', name: 'Sopa de letras', icon: 'A', color: '#C2410C', about: 'Busca seis palabras bien boricuas.' },
] as const;
