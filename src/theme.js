// Centralized colors & tokens for dashboard cards and charts

const theme = {
  cards: {
    sleep: {
      bg: '#EFF6FF',     // light blue background
      border: '#60A5FA', // medium blue border
      line: '#3B82F6',   // darker blue trend line
    },
    bg: {
      bg: '#F0FDF4',     // light green background
      border: '#34D399', // medium green border
      line: '#10B981',   // darker green trend line
    },
    migraine: {
      bg: '#FEF2F2',     // light red/pink background
      border: '#F87171', // medium red border
      line: '#EF4444',   // darker red trend line
    },
  },
};

/**
 * Helper to pull the right colors for a given card type.
 * Example: const { bg, border, line } = cardColors('sleep')
 */
export function cardColors(card) {
  return theme.cards[card] || {};
}

export default theme;