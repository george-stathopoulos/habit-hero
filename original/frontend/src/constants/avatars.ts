export interface Avatar {
  id: number;
  name_el: string;
  name_en: string;
  image: string;
}

// Child profile avatars - expanded list
export const AVATARS: Avatar[] = [
  // Animals
  { id: 1, name_el: 'Λεοντάρι', name_en: 'Lion', image: '🦁' },
  { id: 2, name_el: 'Αρκούδα', name_en: 'Bear', image: '🐻' },
  { id: 3, name_el: 'Αλεπού', name_en: 'Fox', image: '🦊' },
  { id: 4, name_el: 'Πάντα', name_en: 'Panda', image: '🐼' },
  { id: 5, name_el: 'Μονόκερος', name_en: 'Unicorn', image: '🦄' },
  { id: 6, name_el: 'Δράκος', name_en: 'Dragon', image: '🐉' },
  { id: 7, name_el: 'Κουκουβάγια', name_en: 'Owl', image: '🦉' },
  { id: 8, name_el: 'Τίγρης', name_en: 'Tiger', image: '🐯' },
  { id: 9, name_el: 'Κοάλα', name_en: 'Koala', image: '🐨' },
  { id: 10, name_el: 'Αστροναύτης', name_en: 'Astronaut', image: '👨‍🚀' },
  { id: 11, name_el: 'Σούπερ Ήρωας', name_en: 'Superhero', image: '🦸' },
  { id: 12, name_el: 'Νίντζα', name_en: 'Ninja', image: '🥷' },
  // New avatars
  { id: 13, name_el: 'Λύκος', name_en: 'Wolf', image: '🐺' },
  { id: 14, name_el: 'Κουνέλι', name_en: 'Rabbit', image: '🐰' },
  { id: 15, name_el: 'Γάτα', name_en: 'Cat', image: '🐱' },
  { id: 16, name_el: 'Σκύλος', name_en: 'Dog', image: '🐶' },
  { id: 17, name_el: 'Δελφίνι', name_en: 'Dolphin', image: '🐬' },
  { id: 18, name_el: 'Πεταλούδα', name_en: 'Butterfly', image: '🦋' },
  { id: 19, name_el: 'Πιγκουίνος', name_en: 'Penguin', image: '🐧' },
  { id: 20, name_el: 'Χελώνα', name_en: 'Turtle', image: '🐢' },
  { id: 21, name_el: 'Αγελάδα', name_en: 'Cow', image: '🐮' },
  { id: 22, name_el: 'Μέλισσα', name_en: 'Bee', image: '🐝' },
  { id: 23, name_el: 'Πριγκίπισσα', name_en: 'Princess', image: '👸' },
  { id: 24, name_el: 'Πρίγκιπας', name_en: 'Prince', image: '🤴' },
];

// Emojis for habits/tasks - organized by category
export const HABIT_EMOJI_CATEGORIES = {
  hygiene: {
    label: '🧼 Υγιεινή',
    emojis: ['🪥', '🚿', '🧼', '🧴', '💅', '🛁', '💆', '🧽', '🪒', '🧻'],
  },
  health: {
    label: '💪 Υγεία & Άθληση',
    emojis: ['🏃', '⚽', '🏀', '🎾', '🏊', '🚴', '🧘', '💪', '🥗', '🍎', '💊', '😴', '🏋️', '🤸', '⛹️', '🏌️', '🏇', '🥊', '🥋', '🤾', '🏐', '🏈', '⚾', '🥎', '🏒', '🥅', '🎿', '⛷️', '🏂', '🛷'],
  },
  education: {
    label: '📚 Μάθηση',
    emojis: ['📚', '✏️', '📝', '🎓', '🧮', '🔬', '🎨', '🎵', '🎹', '📖', '🖊️', '📐', '📏', '🗃️', '💻', '🖥️', '⌨️', '🔭', '🧪', '🧬'],
  },
  organization: {
    label: '🧹 Οργάνωση',
    emojis: ['🧹', '🛏️', '👕', '🎒', '📅', '⏰', '🗂️', '🧺', '🪣', '🧤', '👖', '👗', '🧦', '🧣', '👒', '🎩', '👟', '👠'],
  },
  social: {
    label: '👋 Κοινωνικά',
    emojis: ['👋', '🤝', '💬', '🗣️', '👂', '💭', '❤️', '🤗', '😊', '👍', '🙏', '🤲'],
  },
  nature: {
    label: '🌱 Φύση',
    emojis: ['🌱', '🌳', '♻️', '🐕', '🐈', '🌻', '🌷', '🌸', '🍀', '🌿', '🌾', '🦋', '🐝', '🐞', '🐢', '🐟', '🐬', '🦜', '🐰', '🐹'],
  },
  creative: {
    label: '🎨 Δημιουργία',
    emojis: ['🎮', '🎬', '🎤', '🎭', '🧩', '🎲', '🏆', '⭐', '🌟', '✨', '🎸', '🎺', '🎻', '🥁', '🎧', '🎨', '🖌️', '✂️', '🧶', '🪡'],
  },
  transport: {
    label: '🚗 Μετακίνηση',
    emojis: ['🚗', '🚌', '🚎', '🏎️', '🚲', '🛴', '🛹', '🛼', '✈️', '🚀', '🛶', '⛵', '🚁'],
  },
  food: {
    label: '🍽️ Φαγητό',
    emojis: ['🍽️', '🥤', '🧃', '🥛', '🍳', '🥣', '🥪', '🍱', '🥡', '🧁', '🍪', '🍓', '🍌', '🥕', '🥦', '🍇'],
  },
};

// Flat array of all habit emojis (for backwards compatibility)
export const HABIT_EMOJIS = Object.values(HABIT_EMOJI_CATEGORIES).flatMap(cat => cat.emojis);

// Emojis for rewards - organized by category
export const REWARD_EMOJI_CATEGORIES = {
  gifts: {
    label: '🎁 Δώρα',
    emojis: ['🎁', '🎀', '🎊', '🎉', '🎈', '🧸', '🪀', '🪁', '🎄', '🎃'],
  },
  food: {
    label: '🍦 Φαγητό & Γλυκά',
    emojis: ['🍦', '🍕', '🍔', '🍟', '🍿', '🍩', '🍪', '🎂', '🧁', '🍫', '🍬', '🍭', '🥤', '🧃'],
  },
  entertainment: {
    label: '🎬 Ψυχαγωγία',
    emojis: ['🎬', '🎮', '📱', '🎧', '📺', '🎪', '🎢', '🎡', '🎠', '🎯', '🎰', '🎲', '🃏'],
  },
  sports: {
    label: '⚽ Αθλητισμός',
    emojis: ['⚽', '🏊', '🚲', '🛹', '⛸️', '🎿', '🏄', '🏇', '🏌️', '🎣', '🥏', '🪃'],
  },
  arts: {
    label: '🎨 Τέχνη & Μουσική',
    emojis: ['🎨', '🎵', '🎸', '🎹', '🎭', '🎤', '🎻', '🥁', '🎺', '📚', '✏️'],
  },
  special: {
    label: '👑 Ειδικά',
    emojis: ['🏆', '👑', '💎', '🌈', '🦋', '🐶', '🐱', '🦄', '🌟', '⭐', '💫', '✨', '❤️', '💝'],
  },
};

// Flat array of all reward emojis (for backwards compatibility)
export const REWARD_EMOJIS = Object.values(REWARD_EMOJI_CATEGORIES).flatMap(cat => cat.emojis);

export const AVATAR_LEVELS = [
  { level: 1, name_el: 'Αρχάριος Ήρωας', name_en: 'Beginner Hero', points_required: 0, badge: '🌱' },
  { level: 2, name_el: 'Ανερχόμενος Ήρωας', name_en: 'Rising Hero', points_required: 100, badge: '⭐' },
  { level: 3, name_el: 'Έμπειρος Ήρωας', name_en: 'Experienced Hero', points_required: 300, badge: '🌟' },
  { level: 4, name_el: 'Σούπερ Ήρωας', name_en: 'Super Hero', points_required: 600, badge: '💫' },
  { level: 5, name_el: 'Θρυλικός Ήρωας', name_en: 'Legendary Hero', points_required: 1000, badge: '👑' },
];

// Parent avatars - more mature options
export const PARENT_AVATARS: Avatar[] = [
  // People
  { id: 101, name_el: 'Μαμά', name_en: 'Mom', image: '👩' },
  { id: 102, name_el: 'Μπαμπάς', name_en: 'Dad', image: '👨' },
  { id: 103, name_el: 'Γιαγιά', name_en: 'Grandma', image: '👵' },
  { id: 104, name_el: 'Παππούς', name_en: 'Grandpa', image: '👴' },
  { id: 105, name_el: 'Σούπερ Μαμά', name_en: 'Super Mom', image: '🦸‍♀️' },
  { id: 106, name_el: 'Σούπερ Μπαμπάς', name_en: 'Super Dad', image: '🦸‍♂️' },
  // Fun & Friendly
  { id: 107, name_el: 'Καρδιά', name_en: 'Heart', image: '❤️' },
  { id: 108, name_el: 'Αστέρι', name_en: 'Star', image: '⭐' },
  { id: 109, name_el: 'Ήλιος', name_en: 'Sun', image: '☀️' },
  { id: 110, name_el: 'Ουράνιο Τόξο', name_en: 'Rainbow', image: '🌈' },
  { id: 111, name_el: 'Λουλούδι', name_en: 'Flower', image: '🌸' },
  { id: 112, name_el: 'Δέντρο', name_en: 'Tree', image: '🌳' },
  // Animals
  { id: 113, name_el: 'Λεοντάρι', name_en: 'Lion', image: '🦁' },
  { id: 114, name_el: 'Αρκούδα', name_en: 'Bear', image: '🐻' },
  { id: 115, name_el: 'Κουκουβάγια', name_en: 'Owl', image: '🦉' },
  { id: 116, name_el: 'Πεταλούδα', name_en: 'Butterfly', image: '🦋' },
  // Symbols
  { id: 117, name_el: 'Κορώνα', name_en: 'Crown', image: '👑' },
  { id: 118, name_el: 'Διαμάντι', name_en: 'Diamond', image: '💎' },
  { id: 119, name_el: 'Τριφύλλι', name_en: 'Clover', image: '🍀' },
  { id: 120, name_el: 'Σπίτι', name_en: 'Home', image: '🏠' },
];
