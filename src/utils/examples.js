export const EXAMPLE_GRAMMARS = [
  {
    name: 'Classic Nullable',
    description: 'S → AB | a, with A and B both nullable',
    text: `S -> AB | a\nA -> aA | ε\nB -> bB | ε`,
  },
  {
    name: 'Simple Epsilon',
    description: 'S → aSb | ε — language changes after null removal',
    text: `S -> aSb | ε`,
  },
  {
    name: 'Unit Production Chain',
    description: 'Contains unit productions A → B → C',
    text: `S -> A | B | c\nA -> B | a\nB -> C | b\nC -> c | d`,
  },
  {
    name: 'Useless Symbols',
    description: 'Has non-generating and unreachable non-terminals',
    text: `S -> A | a\nA -> aA | a\nB -> b\nC -> cC`,
  },
  {
    name: 'Complex Mixed',
    description: 'Requires all three simplification steps',
    text: `S -> aAb | B | ε\nA -> B | aA | ε\nB -> b | C\nC -> AB | c`,
  },
  {
    name: 'Palindrome Grammar',
    description: 'Grammar for palindromes over {a, b}',
    text: `S -> aSa | bSb | a | b | ε`,
  },
];
