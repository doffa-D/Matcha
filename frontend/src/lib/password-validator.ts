// Common English words that should not be accepted as passwords
// This is a subset - in production, use a larger dictionary
const COMMON_WORDS = new Set([
  // Top common passwords
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "master",
  "dragon",
  "111111",
  "baseball",
  "iloveyou",
  "trustno1",
  "sunshine",
  "princess",
  "welcome",
  "shadow",
  "superman",
  "michael",
  "football",
  "password1",
  "password123",

  // Common English words
  "the",
  "and",
  "that",
  "have",
  "for",
  "not",
  "with",
  "you",
  "this",
  "but",
  "his",
  "from",
  "they",
  "say",
  "her",
  "she",
  "will",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "out",
  "about",
  "who",
  "get",
  "which",
  "when",
  "make",
  "can",
  "like",
  "time",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "love",
  "hate",
  "life",
  "death",
  "hello",
  "world",
  "admin",
  "user",
  "test",
  "guest",
  "login",
  "letmein",
  "access",
  "secret",
  "private",

  // Simple patterns
  "abcdef",
  "abcdefg",
  "abcdefgh",
  "qwertyuiop",
  "asdfgh",
  "zxcvbn",
  "123456789",
  "1234567890",
  "0987654321",
  "11111111",
  "00000000",

  // Common names
  "james",
  "john",
  "robert",
  "michael",
  "william",
  "david",
  "richard",
  "joseph",
  "thomas",
  "charles",
  "mary",
  "patricia",
  "jennifer",
  "linda",
  "elizabeth",
  "barbara",
  "susan",
  "jessica",
  "sarah",
  "karen",
  "matthew",
  "daniel",
  "anthony",

  // Keyboard patterns
  "qwerty123",
  "asdf1234",
  "zxcvbnm",
  "1qaz2wsx",
  "qazwsx",

  // Seasons, months, days
  "summer",
  "winter",
  "spring",
  "autumn",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",

  // Tech terms
  "computer",
  "internet",
  "google",
  "facebook",
  "twitter",
  "instagram",
  "apple",
  "samsung",
  "microsoft",
  "amazon",
  "netflix",
]);

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  // Check minimum length (8 characters)
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else {
    strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
    if (password.length >= 16) strengthScore += 1;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    strengthScore += 1;
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    strengthScore += 1;
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    strengthScore += 1;
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*...)",
    );
  } else {
    strengthScore += 2;
  }

  // Check against common words
  const lowerPassword = password.toLowerCase();

  // Direct match
  if (COMMON_WORDS.has(lowerPassword)) {
    errors.push("Password is too common. Please choose something more unique");
    strengthScore = Math.max(0, strengthScore - 3);
  }

  // Check if password contains a common word
  for (const word of COMMON_WORDS) {
    if (word.length >= 4 && lowerPassword.includes(word)) {
      errors.push(`Password contains a common word: "${word}"`);
      strengthScore = Math.max(0, strengthScore - 2);
      break; // Only report one common word
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      "Password should not contain repeated characters (e.g., 'aaa')",
    );
    strengthScore = Math.max(0, strengthScore - 1);
  }

  // Check for sequential characters
  if (
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
      password,
    )
  ) {
    errors.push(
      "Password should not contain sequential characters (e.g., 'abc', '123')",
    );
    strengthScore = Math.max(0, strengthScore - 1);
  }

  // Determine strength
  let strength: PasswordValidationResult["strength"];
  if (strengthScore <= 2) {
    strength = "weak";
  } else if (strengthScore <= 4) {
    strength = "fair";
  } else if (strengthScore <= 6) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export function getStrengthColor(
  strength: PasswordValidationResult["strength"],
): string {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "fair":
      return "bg-orange-500";
    case "good":
      return "bg-yellow-500";
    case "strong":
      return "bg-matcha";
  }
}

export function getStrengthWidth(
  strength: PasswordValidationResult["strength"],
): string {
  switch (strength) {
    case "weak":
      return "w-1/4";
    case "fair":
      return "w-2/4";
    case "good":
      return "w-3/4";
    case "strong":
      return "w-full";
  }
}
