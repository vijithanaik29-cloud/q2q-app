import { SPONSOR_TIERS } from '../data/sponsors';
import './SponsorBanner.css';

export default function SponsorBanner({ sponsor }) {
  if (!sponsor) return null;

  const tier = SPONSOR_TIERS[sponsor.tier] || SPONSOR_TIERS.community;

  return (
    <div className="sponsor-banner">
      <div className="container sponsor-banner__inner">
        <span className="sponsor-banner__label">{tier.label}</span>
        <div className="sponsor-banner__divider" />
        <a
          href={sponsor.link}
          target="_blank"
          rel="noopener noreferrer"
          className="sponsor-banner__name"
        >
          {sponsor.name}
        </a>
        {sponsor.tagline && (
          <span className="sponsor-banner__tagline">{sponsor.tagline}</span>
        )}
        {sponsor.city && (
          <span className="sponsor-banner__city">{sponsor.city}</span>
        )}
      </div>
    </div>
  );
}
