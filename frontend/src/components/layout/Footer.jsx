import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    title: 'Discover',
    links: [
      { label: 'Buy a home', to: '/properties?listingType=SALE' },
      { label: 'Rent a home', to: '/properties?listingType=RENT' },
      { label: 'New projects', to: '/projects' },
      { label: 'Find an agent', to: '/agents' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'CRM for agencies', to: '/register-company' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'AI assistant', to: '/#ai-assistant' },
      { label: 'Investment tools', to: '/#investment' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Testimonials', to: '/#testimonials' },
      { label: 'FAQ', to: '/#faq' },
      { label: 'Contact', to: '/#contact' },
    ],
  },
];

export const Footer = () => (
  <footer className="bg-charcoal-950 text-ivory-100">
    <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
      <div className="col-span-2">
        <p className="font-serif text-2xl mb-3">
          Prop<span className="text-terracotta-400">Flow</span>
        </p>
        <p className="text-sm text-charcoal-300 max-w-xs">
          Turning properties into opportunities — a complete platform for agencies, agents, developers, and homebuyers.
        </p>
      </div>
      {COLUMNS.map((col) => (
        <div key={col.title}>
          <p className="text-xs tracking-widest2 uppercase text-charcoal-400 mb-4">{col.title}</p>
          <ul className="space-y-3">
            {col.links.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-charcoal-200 hover:text-terracotta-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-charcoal-800 py-6 px-6 text-xs text-charcoal-400 flex flex-col md:flex-row justify-between max-w-7xl mx-auto gap-2">
      <span>© {new Date().getFullYear()} PropFlow. All rights reserved.</span>
      <span>Made for agencies, agents, and homebuyers across India.</span>
    </div>
  </footer>
);
