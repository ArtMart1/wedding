const ACCUSATIVE_NAME_OVERRIDES: Record<string, string> = {
  лев: "льва",
  любовь: "любовь",
  павел: "павла",
  петр: "петра",
  пётр: "петра"
};

const FEMININE_SOFT_SIGN_NAMES = new Set(["любовь"]);
const CYRILLIC_WORD_PATTERN = /^[А-ЯЁа-яё]+$/;
const CONSONANT_ENDING_PATTERN = /[бвгджзклмнпрстфхцчшщ]$/u;

function preserveNameCase(source: string, next: string): string {
  if (source.toUpperCase() === source) {
    return next.toUpperCase();
  }

  if (source.toLowerCase() === source) {
    return next;
  }

  return `${next.charAt(0).toUpperCase()}${next.slice(1)}`;
}

function inflectRussianNameWordToAccusative(word: string): string {
  if (!CYRILLIC_WORD_PATTERN.test(word)) {
    return word;
  }

  const normalizedWord = word.toLowerCase();
  const override = ACCUSATIVE_NAME_OVERRIDES[normalizedWord];

  if (override) {
    return preserveNameCase(word, override);
  }

  let inflected = normalizedWord;

  if (normalizedWord.endsWith("ия")) {
    inflected = `${normalizedWord.slice(0, -2)}ию`;
  } else if (normalizedWord.endsWith("ья")) {
    inflected = `${normalizedWord.slice(0, -2)}ью`;
  } else if (normalizedWord.endsWith("а")) {
    inflected = `${normalizedWord.slice(0, -1)}у`;
  } else if (normalizedWord.endsWith("я")) {
    inflected = `${normalizedWord.slice(0, -1)}ю`;
  } else if (normalizedWord.endsWith("й")) {
    inflected = `${normalizedWord.slice(0, -1)}я`;
  } else if (normalizedWord.endsWith("ь")) {
    inflected = FEMININE_SOFT_SIGN_NAMES.has(normalizedWord) ? normalizedWord : `${normalizedWord.slice(0, -1)}я`;
  } else if (CONSONANT_ENDING_PATTERN.test(normalizedWord)) {
    inflected = `${normalizedWord}а`;
  }

  return preserveNameCase(word, inflected);
}

export function inflectFirstNameToAccusative(firstName: string): string {
  return firstName
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || part === "-") {
        return part;
      }

      return inflectRussianNameWordToAccusative(part);
    })
    .join("");
}
