export type FooterLink = {
  label: string;
  url: string;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};

export type FooterBrand = {
  title: string;
  tagline?: string;
  description?: string;
};

export type SocialLink = {
  label: string;
  url: string;
  icon: 'twitter' | 'github' | 'linkedin';
};

export const footerBrand: FooterBrand = {
  title: 'Collab Quest',
  tagline: 'Build Together, Code Better',
  description:
    'Experience real-time collaborative coding with AI-powered assistance. Join forces with developers worldwide and elevate your coding journey.',
};

export const footerSections: FooterSection[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Collaborative Editor', url: '/collab' },
      { label: 'DSA Sheet', url: '/dsa-sheet' },
      { label: 'Coding Quizzes', url: '/quiz' },
      { label: 'DSA Practice', url: '#' },
      { label: 'Hackathons', url: '#' },
      { label: 'Weekly Contests', url: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', url: '#' },
      { label: 'API Reference', url: '#' },
      { label: 'Tutorials', url: '#' },
      { label: 'Code Examples', url: '#' },
      { label: 'Best Practices', url: '#' },
      { label: 'Community Guidelines', url: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', url: '#' },
      { label: 'Contact Us', url: '#' },
      { label: 'Bug Report', url: '#' },
      { label: 'Feature Request', url: '#' },
      { label: 'Status Page', url: '#' },
      { label: 'FAQ', url: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', url: '/about' },
      { label: 'Careers', url: '#' },
      { label: 'Blog', url: '#' },
      { label: 'Press Kit', url: '#' },
      { label: 'Partners', url: '#' },
      { label: 'Privacy Policy', url: '#' },
      { label: 'Terms of Service', url: '#' },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { label: 'Twitter', url: '#', icon: 'twitter' },
  { label: 'GitHub', url: '#', icon: 'github' },
  { label: 'LinkedIn', url: '#', icon: 'linkedin' },
];

export const copyrightText = `© ${new Date().getFullYear()} Collab Quest. All rights reserved.`;

