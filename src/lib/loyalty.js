// Minimum confirmed signals before showing a tier
const MIN_SIGNALS = 2;

export function getLoyaltyTier(email, allBookings, checkedIn, noShows) {
  if (!email) return null;
  const userBookings = allBookings.filter(b => b.attendee?.email === email);
  const attended = userBookings.filter(b => checkedIn.has(b.id)).length;
  const noShow   = userBookings.filter(b => noShows.has(b.id)).length;
  const total = attended + noShow;
  if (total < MIN_SIGNALS) return null;
  const rate = attended / total;
  if (rate >= 0.8) return 'high';
  if (rate >= 0.5) return 'medium';
  return 'low';
}

export const LOYALTY_META = {
  high:   { label: 'High loyalty',   color: '#34d399', dot: '●' },
  medium: { label: 'Usually attends', color: '#f59e0b', dot: '●' },
  low:    { label: 'Often no-show',   color: '#f87171', dot: '●' },
};
