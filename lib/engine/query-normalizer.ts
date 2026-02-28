/**
 * Normalizes user queries so semantically identical prompts
 * produce literally identical strings before reaching Claude.
 *
 * "Show me jackets" and "I want to see jackets" both → "Jackets"
 */

const PREFIXES = [
  /^can you show me\s+/i,
  /^could you show me\s+/i,
  /^i'?d like to see\s+/i,
  /^i would like to see\s+/i,
  /^i want to see\s+/i,
  /^i want to view\s+/i,
  /^i'?d like to view\s+/i,
  /^please show me\s+/i,
  /^please show\s+/i,
  /^please list\s+/i,
  /^please display\s+/i,
  /^show me all the\s+/i,
  /^show me all\s+/i,
  /^show me the\s+/i,
  /^show me\s+/i,
  /^display all the\s+/i,
  /^display all\s+/i,
  /^display the\s+/i,
  /^display\s+/i,
  /^list all the\s+/i,
  /^list all\s+/i,
  /^list the\s+/i,
  /^list\s+/i,
  /^let me see\s+/i,
  /^let me view\s+/i,
  /^give me\s+/i,
  /^get me\s+/i,
  /^find me\s+/i,
  /^pull up\s+/i,
  /^i want\s+/i,
  /^i need\s+/i,
];

const TRAILING_FILLER = /\s*(?:please|thanks|thank you|for me)\s*[.!?]*$/i;
const WHAT_DO_YOU_HAVE = /^what\s+(.+?)\s+do you have\s*[?]?\s*$/i;

export function normalizeQuery(query: string): string {
  const original = query.trim().replace(/\s+/g, " ");
  if (!original) return original;

  let result = original;

  // Handle "what X do you have?" → X
  const whatMatch = result.match(WHAT_DO_YOU_HAVE);
  if (whatMatch) {
    result = whatMatch[1].trim();
  } else {
    // Strip the first matching prefix
    for (const prefix of PREFIXES) {
      const stripped = result.replace(prefix, "");
      if (stripped !== result) {
        result = stripped;
        break;
      }
    }
  }

  // Strip trailing filler
  result = result.replace(TRAILING_FILLER, "").trim();

  // If we stripped everything, fall back to the original
  if (!result) return original;

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}
