export type WisdomCategory =
  | "law"
  | "ancient-wisdom"
  | "etymology"
  | "philosophy"
  | "business"
  | "universe"
  | "proverbs"
  | "science";

export interface WisdomEntry {
  id: string;
  term: string;
  origin: string;
  category: WisdomCategory;
  definition: string;
  example?: string;
  source?: string;
}

export const CATEGORY_LABELS: Record<WisdomCategory, string> = {
  "law":            "Law",
  "ancient-wisdom": "Ancient Wisdom",
  "etymology":      "Etymology",
  "philosophy":     "Philosophy",
  "business":       "Business",
  "universe":       "Universe & Beyond",
  "proverbs":       "Proverbs",
  "science":        "Science & Nature",
};

export const CATEGORY_ICONS: Record<WisdomCategory, string> = {
  "law":            "⚖️",
  "ancient-wisdom": "🏛️",
  "etymology":      "📖",
  "philosophy":     "🧠",
  "business":       "💼",
  "universe":       "🌌",
  "proverbs":       "🌿",
  "science":        "🔬",
};

export const WISDOM_ENTRIES: WisdomEntry[] = [
  // LAW
  {
    id: "habeas-corpus",
    term: "Habeas Corpus",
    origin: "Latin",
    category: "law",
    definition: "A fundamental legal principle meaning 'you shall have the body.' It requires that a person under arrest be brought before a judge or into court. It is the bedrock protection against unlawful imprisonment.",
    example: "A prisoner may file a writ of habeas corpus to challenge the legality of their detention.",
    source: "English Common Law, 1679",
  },
  {
    id: "lex-talionis",
    term: "Lex Talionis",
    origin: "Latin",
    category: "law",
    definition: "The law of retaliation — 'an eye for an eye, a tooth for a tooth.' One of the oldest legal principles in human history, ensuring punishment is proportional to the offence.",
    source: "Code of Hammurabi, circa 1754 BC",
  },
  {
    id: "mens-rea",
    term: "Mens Rea",
    origin: "Latin",
    category: "law",
    definition: "The mental element of a crime — the guilty mind. A person cannot usually be convicted of a crime unless they had the intention, knowledge, or recklessness to commit it.",
    example: "A surgeon who accidentally harms a patient lacks mens rea; a poisoner does not.",
  },
  {
    id: "prima-facie",
    term: "Prima Facie",
    origin: "Latin",
    category: "law",
    definition: "On the face of it. Evidence that is sufficient to establish a fact or raise a presumption of guilt unless disproved. The starting point of most legal proceedings.",
  },
  {
    id: "stare-decisis",
    term: "Stare Decisis",
    origin: "Latin",
    category: "law",
    definition: "To stand by decisions. The legal principle that past court decisions should be followed as precedent, ensuring consistency and predictability in the law.",
    source: "English Common Law",
  },
  {
    id: "caveat-emptor",
    term: "Caveat Emptor",
    origin: "Latin",
    category: "law",
    definition: "Let the buyer beware. The principle that a buyer is responsible for checking the quality of goods before purchase. Still widely applied in property law.",
  },
  {
    id: "in-loco-parentis",
    term: "In Loco Parentis",
    origin: "Latin",
    category: "law",
    definition: "In the place of a parent. A legal doctrine placing an individual or organisation in the role of a parent — responsible for the care and welfare of a child.",
  },
  {
    id: "pro-bono",
    term: "Pro Bono",
    origin: "Latin",
    category: "law",
    definition: "Short for 'pro bono publico' — for the public good. Professional work done voluntarily and without payment for those who cannot afford legal services.",
  },
  // ANCIENT WISDOM
  {
    id: "ubuntu",
    term: "Ubuntu",
    origin: "Nguni Bantu, Africa",
    category: "ancient-wisdom",
    definition: "I am because we are. A philosophy of collective humanity — the belief that a person exists only through their relationship with others. Kindness, community, and shared humanity are its pillars.",
    source: "African Philosophy",
  },
  {
    id: "ma-at",
    term: "Ma'at",
    origin: "Ancient Egyptian",
    category: "ancient-wisdom",
    definition: "The ancient Egyptian concept of truth, justice, harmony, and cosmic order. Pharaohs were expected to rule by Ma'at, and souls were judged against its feather after death.",
    source: "Ancient Egyptian Religion, circa 3100 BC",
  },
  {
    id: "wu-wei",
    term: "Wu Wei",
    origin: "Chinese (Taoist)",
    category: "ancient-wisdom",
    definition: "Non-action or effortless action. The Taoist principle of aligning with the natural flow of the universe — achieving more by forcing less. Power through stillness.",
    source: "Tao Te Ching, Lao Tzu, circa 400 BC",
  },
  {
    id: "stoicism",
    term: "Stoicism",
    origin: "Ancient Greek",
    category: "ancient-wisdom",
    definition: "The philosophy of enduring pain or hardship without complaint while focusing only on what you can control. Founded by Zeno of Citium, it shaped Roman emperors and modern psychology alike.",
    source: "Zeno of Citium, Athens, 300 BC",
  },
  {
    id: "ikigai",
    term: "Ikigai",
    origin: "Japanese",
    category: "ancient-wisdom",
    definition: "Your reason for being. The intersection of what you love, what you are good at, what the world needs, and what you can be paid for. The secret to a long and meaningful life.",
    source: "Japanese Philosophy, Okinawa",
  },
  {
    id: "dharma",
    term: "Dharma",
    origin: "Sanskrit",
    category: "ancient-wisdom",
    definition: "Your duty, your path, your cosmic order. In Hinduism and Buddhism, dharma is the moral law governing individual conduct — the right way of living in accordance with the universe.",
    source: "Hindu & Buddhist tradition, circa 1500 BC",
  },
  {
    id: "mansa",
    term: "Mansa",
    origin: "Mandinka, West Africa",
    category: "ancient-wisdom",
    definition: "King of Kings. The title held by Mansa Musa I of the Mali Empire — the wealthiest individual in human history. His 1324 pilgrimage to Mecca distributed so much gold it caused inflation across North Africa and the Middle East.",
    source: "Mali Empire, West Africa, 14th Century",
  },
  // ETYMOLOGY
  {
    id: "salary",
    term: "Salary",
    origin: "Latin — salarium",
    category: "etymology",
    definition: "From the Latin 'sal' meaning salt. Roman soldiers were sometimes paid in salt — a precious commodity used to preserve food. To be 'worth your salt' is to earn your pay.",
    source: "Ancient Roman Empire",
  },
  {
    id: "muscle",
    term: "Muscle",
    origin: "Latin — musculus",
    category: "etymology",
    definition: "From the Latin 'musculus' meaning 'little mouse.' When a muscle flexes under skin, it resembles a mouse moving beneath a cloth — so the Romans named it accordingly.",
  },
  {
    id: "disaster",
    term: "Disaster",
    origin: "Italian — disastro",
    category: "etymology",
    definition: "From the Italian 'dis' (bad) and 'astro' (star). A disaster was literally a bad star — the ancient belief that misfortune was caused by unfavourable alignment of the stars.",
  },
  {
    id: "hazard",
    term: "Hazard",
    origin: "Arabic — az-zahr",
    category: "etymology",
    definition: "From the Arabic 'az-zahr' meaning dice. Risk and chance were so linked to gambling in the medieval mind that the word for dice became the word for danger.",
    source: "Arabic via Spanish, 12th Century",
  },
  {
    id: "robot",
    term: "Robot",
    origin: "Czech — robota",
    category: "etymology",
    definition: "From the Czech 'robota' meaning forced labour or drudgery. Coined by playwright Karel Čapek in 1920 in his play R.U.R., describing artificial workers made to serve humans.",
    source: "Karel Čapek, 1920",
  },
  {
    id: "capitalism",
    term: "Capitalism",
    origin: "Latin — caput",
    category: "etymology",
    definition: "From the Latin 'caput' meaning head (as in head of cattle — livestock as wealth). Capital originally meant the principal sum of a loan. The system built around accumulating capital took its name from this root.",
  },
  // PHILOSOPHY
  {
    id: "cogito-ergo-sum",
    term: "Cogito, Ergo Sum",
    origin: "Latin",
    category: "philosophy",
    definition: "I think, therefore I am. René Descartes' foundational statement of Western philosophy. The one thing that cannot be doubted is the existence of the doubter.",
    source: "René Descartes, Discourse on the Method, 1637",
  },
  {
    id: "socratic-method",
    term: "The Socratic Method",
    origin: "Ancient Greek",
    category: "philosophy",
    definition: "A form of dialogue based on asking and answering questions to stimulate critical thinking and expose contradictions in beliefs. Still the foundation of legal education and scientific inquiry.",
    source: "Socrates, Athens, 470–399 BC",
  },
  {
    id: "tabula-rasa",
    term: "Tabula Rasa",
    origin: "Latin",
    category: "philosophy",
    definition: "Blank slate. The theory that humans are born without innate mental content — that knowledge, character, and identity are formed entirely through experience and environment.",
    source: "John Locke, An Essay Concerning Human Understanding, 1689",
  },
  {
    id: "memento-mori",
    term: "Memento Mori",
    origin: "Latin",
    category: "philosophy",
    definition: "Remember that you must die. A philosophical practice of reflecting on mortality to gain perspective on life — stripping away triviality and focusing on what truly matters.",
    source: "Roman Stoic Philosophy",
  },
  {
    id: "amor-fati",
    term: "Amor Fati",
    origin: "Latin",
    category: "philosophy",
    definition: "Love of fate. The Stoic and Nietzschean idea of not merely accepting what happens in life but loving it — including the pain, the struggle, and the loss.",
    source: "Friedrich Nietzsche, 1882",
  },
  // BUSINESS
  {
    id: "pareto-principle",
    term: "The Pareto Principle",
    origin: "Italian",
    category: "business",
    definition: "The 80/20 rule. 80% of results come from 20% of causes. Named after economist Vilfredo Pareto, who observed that 80% of Italy's land was owned by 20% of the population.",
    source: "Vilfredo Pareto, 1896",
  },
  {
    id: "occams-razor",
    term: "Occam's Razor",
    origin: "English / Latin",
    category: "business",
    definition: "The simplest explanation is usually correct. Named after 14th-century friar William of Ockham. In business and science, avoid adding unnecessary complexity when a simpler solution exists.",
    source: "William of Ockham, circa 1320",
  },
  {
    id: "compound-interest",
    term: "Compound Interest",
    origin: "Latin — componere",
    category: "business",
    definition: "Einstein reportedly called it the eighth wonder of the world. Interest earned on interest — growth that accelerates over time. The same principle applies to skills, relationships, and knowledge.",
    source: "Albert Einstein (attributed)",
  },
  {
    id: "first-principles",
    term: "First Principles Thinking",
    origin: "Ancient Greek",
    category: "business",
    definition: "Breaking a problem down to its most fundamental truths and rebuilding from there. Aristotle's method, adopted by Elon Musk and modern innovators to challenge assumptions and find breakthrough solutions.",
    source: "Aristotle, circa 350 BC",
  },
  {
    id: "opportunity-cost",
    term: "Opportunity Cost",
    origin: "Economics",
    category: "business",
    definition: "The cost of what you give up when you make a choice. Every yes is a no to everything else. Understanding opportunity cost is the foundation of strategic thinking.",
    source: "Frédéric Bastiat, 1850",
  },
  // UNIVERSE
  {
    id: "entropy",
    term: "Entropy",
    origin: "Greek — entropia",
    category: "universe",
    definition: "The universe's tendency toward disorder. Everything — from stars to systems to businesses — moves from order to chaos without constant energy input. Fighting entropy is the work of life.",
    source: "Rudolf Clausius, Second Law of Thermodynamics, 1865",
  },
  {
    id: "dark-matter",
    term: "Dark Matter",
    origin: "Modern Physics",
    category: "universe",
    definition: "An invisible substance making up 27% of the universe that does not interact with light. We know it exists because of its gravitational effects — a reminder that most of reality is beyond our perception.",
    source: "Fritz Zwicky, 1933",
  },
  {
    id: "fermi-paradox",
    term: "The Fermi Paradox",
    origin: "Modern Physics",
    category: "universe",
    definition: "If the universe is vast and billions of years old, why have we found no evidence of other intelligent life? The silence of the cosmos in the face of its infinite scale is humanity's deepest unanswered question.",
    source: "Enrico Fermi, 1950",
  },
  {
    id: "multiverse",
    term: "The Multiverse",
    origin: "Modern Physics",
    category: "universe",
    definition: "The theoretical existence of multiple, perhaps infinite, parallel universes — each with different physical laws, histories, or outcomes. Every quantum decision may branch a new universe.",
    source: "Hugh Everett III, Many-Worlds Interpretation, 1957",
  },
  // PROVERBS
  {
    id: "still-waters",
    term: "Still Waters Run Deep",
    origin: "English Proverb",
    category: "proverbs",
    definition: "A quiet, calm person often has the greatest depth of knowledge, feeling, and wisdom. Noise and display rarely signal true strength.",
  },
  {
    id: "iron-sharpens-iron",
    term: "Iron Sharpens Iron",
    origin: "Hebrew — Proverbs 27:17",
    category: "proverbs",
    definition: "One person sharpens another. Growth comes through challenge, friction, and the collision of strong minds. Surround yourself with people who make you better.",
    source: "Book of Proverbs, Hebrew Bible",
  },
  {
    id: "know-thyself",
    term: "Know Thyself",
    origin: "Ancient Greek — gnōthi seauton",
    category: "proverbs",
    definition: "Inscribed at the Temple of Apollo at Delphi. The foundation of all wisdom — understanding your own nature, your weaknesses, your biases, and your purpose.",
    source: "Oracle of Delphi, Ancient Greece",
  },
  {
    id: "tall-poppy",
    term: "Tall Poppy Syndrome",
    origin: "Australian / British",
    category: "proverbs",
    definition: "The social tendency to criticise or undermine those who have achieved great success. A warning to ambitious people — and a reminder that greatness attracts attack.",
  },
  // SCIENCE
  {
    id: "golden-ratio",
    term: "The Golden Ratio",
    origin: "Greek — phi (φ)",
    category: "science",
    definition: "A mathematical ratio of approximately 1.618 found throughout nature — in shells, flowers, galaxies, and the human body. Renaissance artists used it to create perfect beauty. Nature uses it to build life.",
    source: "Euclid, Elements, circa 300 BC",
  },
  {
    id: "emergence",
    term: "Emergence",
    origin: "Latin — emergere",
    category: "science",
    definition: "The phenomenon where complex systems develop properties that their individual parts do not possess. A brain cell cannot think. A billion brain cells create consciousness. The whole becomes greater than the sum.",
  },
  {
    id: "butterfly-effect",
    term: "The Butterfly Effect",
    origin: "Chaos Theory",
    category: "science",
    definition: "A butterfly flapping its wings in Brazil can cause a tornado in Texas. Small initial changes in complex systems can produce massively disproportionate outcomes — the foundation of chaos theory.",
    source: "Edward Lorenz, 1963",
  },
];
