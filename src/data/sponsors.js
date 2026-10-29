// Active sponsor shown on the homepage.
// Set active: true on the one that's live, false on all others.
// To change the sponsor: update this file and push to main.

export const SPONSOR_TIERS = {
  community: { label: 'Community Partner', price: 999,  period: 'month' },
  pride:     { label: 'Pride Sponsor',      price: 2499, period: 'month' },
};

// Current active sponsor — set to null to hide the banner
export const activeSponsor = null;

/* Example (uncomment and fill in when you have a real sponsor):
export const activeSponsor = {
  name:    'Nirvana Cafe',
  tagline: 'Safe space for every identity. South Mumbai.',
  link:    'https://nirvanacafe.in',
  tier:    'community',   // 'community' or 'pride'
  city:    'Mumbai',      // null = shown everywhere
};
*/
