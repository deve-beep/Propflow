import { useEffect, useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Bot, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';
import { propertyService } from '../../services/resources';
import { PropertyCard } from '../../components/property/PropertyCard';

const HeroScene = lazy(() => import('../../components/landing/HeroScene').then((m) => ({ default: m.HeroScene })));

const FEATURES = [
  { icon: Search, title: 'Property Discovery', desc: 'Powerful search and filtering across thousands of verified listings with map-based browsing.' },
  { icon: Users, title: 'Complete CRM', desc: 'Track leads through a visual pipeline from first contact to closed deal, with full activity history.' },
  { icon: BarChart3, title: 'Investment Intelligence', desc: 'ROI, rental yield, EMI, and appreciation calculators built into every listing.' },
  { icon: Bot, title: 'AI Assistant', desc: 'Ask natural questions and get answers grounded in your real property data.' },
  { icon: TrendingUp, title: 'Agent Productivity', desc: 'Performance dashboards, automated notifications, and streamlined workflows for every agent.' },
  { icon: ShieldCheck, title: 'Enterprise Security', desc: 'Multi-tenant isolation, role-based access, and encrypted data at every layer.' },
];

const STEPS = [
  { title: 'List or Discover', desc: 'Agents list properties with rich media; buyers search and filter in seconds.' },
  { title: 'Engage & Track', desc: 'Every enquiry becomes a lead, automatically routed and scored in your CRM.' },
  { title: 'Close with Confidence', desc: 'Schedule visits, negotiate, and close deals — all tracked end-to-end.' },
];

const PRICING = [
  { name: 'Starter', price: '₹4,999', period: '/mo', features: ['Up to 5 agents', '200 listings', 'Basic CRM', 'Email support'] },
  { name: 'Professional', price: '₹12,999', period: '/mo', features: ['Up to 25 agents', 'Unlimited listings', 'Full CRM + analytics', 'AI assistant', 'Priority support'], featured: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited agents', 'Custom integrations', 'Dedicated success manager', 'SLA guarantee'] },
];

const FAQS = [
  { q: 'How long does onboarding take?', a: 'Most agencies are fully set up and listing properties within a day.' },
  { q: 'Can customers browse without an account?', a: 'Yes — property discovery, search, and comparison are all open to the public.' },
  { q: "Is my agency's data isolated from others?", a: 'Completely. PropFlow uses strict multi-tenant isolation between agencies.' },
];

export default function LandingPage() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    propertyService
      .list({ limit: 6, sort: 'newest' })
      .then(({ data }) => setFeatured(data.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-charcoal-950 text-ivory-50 min-h-[90vh] flex items-center">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        <div className="relative max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="section-label text-terracotta-400 mb-4">Real Estate, Reimagined</p>
            <h1 className="text-5xl md:text-6xl font-serif leading-[1.05] mb-6">
              Turn Properties Into Opportunities.
            </h1>
            <p className="text-charcoal-300 text-lg mb-10 max-w-lg">
              The complete platform for agencies, agents, developers, and homebuyers — search, manage, and close, all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/properties" className="btn-primary bg-terracotta-600 hover:bg-terracotta-500">
                Explore Properties <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register-company" className="btn-secondary border-ivory-200 text-ivory-50 hover:bg-ivory-50 hover:text-charcoal-900">
                Book a Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label mb-2">Curated Listings</p>
            <h2 className="text-3xl font-serif text-charcoal-900">Featured Properties</h2>
          </div>
          <Link to="/properties" className="btn-ghost hidden sm:flex">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {featured.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      </section>

      <section className="bg-ivory-200 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-label mb-2">Platform</p>
          <h2 className="text-3xl font-serif text-charcoal-900 mb-14 max-w-xl">
            Everything an agency, agent, or developer needs — in one system.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-7 h-7 text-terracotta-600 mb-4" strokeWidth={1.25} />
                <h3 className="text-lg font-serif text-charcoal-900 mb-2">{title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24">
        <p className="section-label mb-2">Process</p>
        <h2 className="text-3xl font-serif text-charcoal-900 mb-14">How PropFlow Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative pl-12">
              <span className="absolute left-0 top-0 text-4xl font-serif text-terracotta-300">0{i + 1}</span>
              <h3 className="text-lg font-serif text-charcoal-900 mb-2">{step.title}</h3>
              <p className="text-sm text-charcoal-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="investment" className="bg-charcoal-900 text-ivory-50 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="section-label text-terracotta-400 mb-3">Investment Intelligence</p>
            <h2 className="text-3xl font-serif mb-6">Know the numbers before you commit.</h2>
            <p className="text-charcoal-300 mb-8">
              Every listing includes live ROI, rental yield, EMI, and appreciation projections.
            </p>
            <Link to="/properties" className="btn-secondary border-ivory-200 text-ivory-50 hover:bg-ivory-50 hover:text-charcoal-900">
              See it in action
            </Link>
          </div>
          <div className="bg-charcoal-800 p-8 space-y-4">
            {[
              ['Gross Rental Yield', '4.2%'],
              ['5-Year Appreciation', '38.6%'],
              ['Est. Monthly EMI', '₹43,391'],
              ['Total 5-Yr Return', '₹46.2 L'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-charcoal-700 pb-3">
                <span className="text-sm text-charcoal-400">{label}</span>
                <span className="font-serif text-terracotta-400">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-assistant" className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div className="bg-sand-100/50 p-8 border border-sand-200">
          <p className="text-xs text-charcoal-400 mb-3">You asked</p>
          <p className="text-lg font-serif text-charcoal-900 mb-6">
            "Find 3-bedroom properties under ₹1.2 crore in Mohali"
          </p>
          <p className="text-xs text-charcoal-400 mb-3">PropFlow found</p>
          <p className="text-sm text-charcoal-600">12 matching properties, sorted by rental yield.</p>
        </div>
        <div>
          <p className="section-label mb-3">AI Property Assistant</p>
          <h2 className="text-3xl font-serif text-charcoal-900 mb-6">Ask, don't search.</h2>
          <p className="text-charcoal-600 mb-8">
            Our assistant is grounded in your actual listing data — no generic answers.
          </p>
          <Link to="/properties" className="btn-primary">
            Try it now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section id="pricing" className="bg-ivory-200 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-label mb-2 text-center">Pricing</p>
          <h2 className="text-3xl font-serif text-charcoal-900 mb-14 text-center">Plans for agencies of every size</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 border ${plan.featured ? 'bg-charcoal-950 text-ivory-50 border-charcoal-950' : 'bg-white border-stone-200'}`}
              >
                <h3 className="font-serif text-xl mb-2">{plan.name}</h3>
                <p className="text-3xl font-serif mb-6">
                  {plan.price}
                  <span className="text-sm">{plan.period}</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`text-sm ${plan.featured ? 'text-charcoal-300' : 'text-charcoal-600'}`}>
                      — {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register-company"
                  className={plan.featured ? 'btn-primary bg-terracotta-600 hover:bg-terracotta-500 w-full' : 'btn-secondary w-full'}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-6 py-24">
        <p className="section-label mb-2 text-center">FAQ</p>
        <h2 className="text-3xl font-serif text-charcoal-900 mb-14 text-center">Common Questions</h2>
        <div className="space-y-8">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border-b border-stone-200 pb-8">
              <h3 className="font-serif text-lg text-charcoal-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-charcoal-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-terracotta-600 text-white py-20 text-center">
        <h2 className="text-3xl font-serif mb-4">Ready to transform your agency?</h2>
        <p className="text-terracotta-100 mb-8">Start your 14-day free trial today. No credit card required.</p>
        <Link to="/register-company" className="btn-primary bg-charcoal-950 hover:bg-charcoal-900">
          Book a Demo <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
