/** Seconds between auto quote / background changes */
export const QUOTE_ROTATE_SECONDS = 8;

export type Quote = {
  text: string;
  author: string;
};

export type QuoteBackground = {
  /** CSS gradient fallback / overlay base */
  gradient: string;
  /** Optional scenic image */
  image?: string;
  /** Accent for UI chips on this bg */
  accent: string;
};

/** Rotating scenic / artistic backgrounds for the quote card */
export const QUOTE_BACKGROUNDS: QuoteBackground[] = [
  {
    gradient: "linear-gradient(145deg, #0ea5e9 0%, #0369a1 45%, #0c4a6e 100%)",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
    accent: "#7dd3fc",
  },
  {
    gradient: "linear-gradient(145deg, #38bdf8 0%, #0284c7 50%, #1e3a5f 100%)",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
    accent: "#bae6fd",
  },
  {
    gradient: "linear-gradient(160deg, #22d3ee 0%, #006fc7 55%, #0f172a 100%)",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80",
    accent: "#a5f3fc",
  },
  {
    gradient: "linear-gradient(135deg, #60a5fa 0%, #1d4ed8 50%, #172554 100%)",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    accent: "#93c5fd",
  },
  {
    gradient: "linear-gradient(150deg, #7dd3fc 0%, #0369a1 40%, #082f49 100%)",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    accent: "#e0f2fe",
  },
  {
    gradient: "linear-gradient(145deg, #67e8f9 0%, #0891b2 45%, #164e63 100%)",
    image:
      "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=900&q=80",
    accent: "#cffafe",
  },
  {
    gradient: "linear-gradient(160deg, #93c5fd 0%, #2563eb 50%, #1e293b 100%)",
    image:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=900&q=80",
    accent: "#dbeafe",
  },
  {
    gradient: "linear-gradient(140deg, #38bdf8 0%, #1d4ed8 55%, #0f172a 100%)",
    image:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=900&q=80",
    accent: "#bae6fd",
  },
];

export function backgroundAtIndex(index: number): QuoteBackground {
  const i =
    ((index % QUOTE_BACKGROUNDS.length) + QUOTE_BACKGROUNDS.length) %
    QUOTE_BACKGROUNDS.length;
  return QUOTE_BACKGROUNDS[i];
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "Your work is going to fill a large part of your life. Do it well.",
    author: "Steve Jobs",
  },
  {
    text: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
  },
  {
    text: "Great things are done by a series of small things brought together.",
    author: "Vincent van Gogh",
  },
  {
    text: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
  },
  {
    text: "A little progress each day adds up to big results.",
    author: "Satya Nani",
  },
  {
    text: "Dream big. Start small. Act now.",
    author: "Robin Sharma",
  },
  {
    text: "Consistency is what transforms average into excellence.",
    author: "Unknown",
  },
  {
    text: "Hard work beats talent when talent doesn't work hard.",
    author: "Tim Notke",
  },
  {
    text: "Be so good they can't ignore you.",
    author: "Steve Martin",
  },
  {
    text: "Make each day your masterpiece.",
    author: "John Wooden",
  },
];

export function dayOfYearIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % MOTIVATIONAL_QUOTES.length;
}

/** Stable quote for a given calendar day. */
export function quoteForDate(date = new Date()): Quote {
  return MOTIVATIONAL_QUOTES[dayOfYearIndex(date)];
}

export function quoteAtIndex(index: number): Quote {
  const i =
    ((index % MOTIVATIONAL_QUOTES.length) + MOTIVATIONAL_QUOTES.length) %
    MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[i];
}
