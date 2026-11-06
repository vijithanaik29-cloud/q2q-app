export const CITIES = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Goa', 'Jaipur', 'Ahmedabad'];

export const CATEGORIES = [
  'Pride March', 'Party', 'Film & Art', 'Support Group',
  'Workshop', 'Drag Show', 'Sports', 'Community',
];

export const CATEGORY_EMOJI = {
  'Pride March': '🏳️‍🌈',
  'Party': '🎉',
  'Film & Art': '🎬',
  'Support Group': '💬',
  'Workshop': '💡',
  'Drag Show': '✨',
  'Sports': '🏃',
  'Community': '🤝',
};

export const events = [];

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatPrice(price) {
  if (price === 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

export function getMinPrice(tickets) {
  const prices = tickets.map(t => t.price);
  const min = Math.min(...prices);
  return min === 0 ? 'Free' : `From ₹${min.toLocaleString('en-IN')}`;
}
