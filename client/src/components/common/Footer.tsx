import React from 'react';
import { Link } from 'react-router-dom';
import {
  footerBrand,
  footerSections,
  socialLinks,
  FooterSection,
  SocialLink,
  copyrightText,
} from '../../data/footer';
import '../Dashboard/Footer.css';

type Props = {
  sections?: FooterSection[];
  onLinkClick?: (section: string, label: string, url: string) => void;
};

const isInternal = (url: string) => url.startsWith('/') && !url.startsWith('//');

const renderIcon = (icon: SocialLink['icon']) => {
  if (icon === 'twitter') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    );
  }
  if (icon === 'github') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.73.5.98 5.26.98 11.54c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53 0-.26-.01-1.12-.02-2.03-3.05.66-3.7-1.31-3.7-1.31-.5-1.27-1.22-1.61-1.22-1.61-.99-.68.07-.67.07-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.58 1.19 3.21.91.1-.71.38-1.19.69-1.47-2.43-.28-4.99-1.22-4.99-5.43 0-1.2.43-2.18 1.13-2.95-.12-.28-.49-1.41.11-2.94 0 0 .92-.29 3.02 1.13a10.5 10.5 0 015.5 0c2.1-1.42 3.02-1.13 3.02-1.13.6 1.53.23 2.66.11 2.94.7.77 1.13 1.75 1.13 2.95 0 4.22-2.56 5.14-5.01 5.41.39.33.74.98.74 1.98 0 1.43-.01 2.58-.01 2.94 0 .29.2.64.76.53 4.35-1.45 7.5-5.56 7.5-10.42C23.02 5.26 18.27.5 12 .5z"/>
      </svg>
    );
  }
  // linkedin
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
};

const Footer: React.FC<Props> = ({ sections = footerSections, onLinkClick }) => {
  return (
    <footer className="dashboard-impressive-footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-brand">
            <h3 className="footer-logo">{footerBrand.title}</h3>
            {footerBrand.tagline && <p className="footer-tagline">{footerBrand.tagline}</p>}
            {footerBrand.description && (
              <p className="footer-description">{footerBrand.description}</p>
            )}
          </div>
          <div className="social-links" aria-label="Social links">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.url}
                className="social-link"
                aria-label={s.label}
                target={s.url.startsWith('http') ? '_blank' : undefined}
                rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={() => onLinkClick?.('social', s.label, s.url)}
              >
                {renderIcon(s.icon)}
              </a>
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="footer-section">
            <h4>{section.title}</h4>
            <ul className="footer-links">
              {section.links.map((l) => (
                <li key={`${section.title}-${l.label}`}>
                  {isInternal(l.url) ? (
                    <Link to={l.url} onClick={() => onLinkClick?.(section.title, l.label, l.url)}>
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onLinkClick?.(section.title, l.label, l.url)}
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="footer-copyright">
            <p>{copyrightText}</p>
            <p>Made with ❤️ for developers worldwide</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


