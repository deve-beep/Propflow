import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BedDouble, Bath, Ruler, MapPin, Heart, Share2, Phone, Mail, Calendar } from 'lucide-react';
import { propertyService, appointmentService, investmentService } from '../../services/resources';
import { formatINR, formatArea, propertyTypeLabel } from '../../utils/format';
import { PageLoader, Button, Badge } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';

export default function PropertyDetailPage() {
  const { idOrSlug } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [emi, setEmi] = useState(null);
  const [visitForm, setVisitForm] = useState({ scheduledDate: '', scheduledTime: '' });
  const [visitStatus, setVisitStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    propertyService
      .getOne(idOrSlug)
      .then(({ data }) => setProperty(data.data))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  useEffect(() => {
    if (!property) return;
    investmentService
      .emi({ principal: Math.round(property.price * 0.8), annualInterestRate: 8.5, tenureYears: 20 })
      .then(({ data }) => setEmi(data.data.emi))
      .catch(() => {});
  }, [property]);

  const handleFavorite = async () => {
    if (!user) return;
    await propertyService.toggleFavorite(property._id);
    setProperty((p) => ({ ...p, isFavorited: !p.isFavorited }));
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!user) {
      setVisitStatus('Please sign in to schedule a visit.');
      return;
    }
    try {
      await appointmentService.request({ property: property._id, ...visitForm });
      setVisitStatus('Visit requested! The agent will confirm shortly.');
    } catch (err) {
      setVisitStatus(err.response?.data?.message || 'Could not schedule visit.');
    }
  };

  if (loading) return <PageLoader />;
  if (!property) return <div className="text-center py-20 text-charcoal-500">Property not found.</div>;

  const images = property.images?.length ? property.images : [{ url: null }];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-10 h-[480px]">
        <div className="lg:col-span-3 bg-stone-100 overflow-hidden">
          {images[activeImage]?.url ? (
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={images[activeImage].url}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal-300">No image available</div>
          )}
        </div>
        <div className="hidden lg:flex flex-col gap-2 overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`h-[112px] bg-stone-100 overflow-hidden border-2 ${activeImage === i ? 'border-terracotta-500' : 'border-transparent'}`}
            >
              {img.url && <img src={img.url} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex gap-2 mb-3">
                <Badge tone="dark">{property.listingType === 'RENT' ? 'For Rent' : 'For Sale'}</Badge>
                <Badge>{propertyTypeLabel(property.propertyType)}</Badge>
              </div>
              <h1 className="text-3xl font-serif text-charcoal-900 mb-2">{property.title}</h1>
              <p className="text-sm text-charcoal-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {property.location?.address}, {property.location?.locality}, {property.location?.city}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleFavorite} className="w-10 h-10 border border-stone-200 flex items-center justify-center hover:border-terracotta-500">
                <Heart className={`w-4 h-4 ${property.isFavorited ? 'fill-terracotta-500 text-terracotta-500' : ''}`} />
              </button>
              <button className="w-10 h-10 border border-stone-200 flex items-center justify-center hover:border-terracotta-500">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-3xl font-serif text-terracotta-600 mb-8">{formatINR(property.price)}</p>

          <div className="grid grid-cols-3 gap-4 mb-10 py-6 border-y border-stone-100">
            {property.bedrooms > 0 && (
              <div className="text-center">
                <BedDouble className="w-5 h-5 mx-auto mb-2 text-charcoal-400" />
                <p className="text-sm text-charcoal-800">{property.bedrooms} Bedrooms</p>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="text-center">
                <Bath className="w-5 h-5 mx-auto mb-2 text-charcoal-400" />
                <p className="text-sm text-charcoal-800">{property.bathrooms} Bathrooms</p>
              </div>
            )}
            <div className="text-center">
              <Ruler className="w-5 h-5 mx-auto mb-2 text-charcoal-400" />
              <p className="text-sm text-charcoal-800">{formatArea(property.area)}</p>
            </div>
          </div>

          <section className="mb-10">
            <h2 className="text-lg font-serif text-charcoal-900 mb-3">Description</h2>
            <p className="text-sm text-charcoal-600 leading-relaxed">{property.description}</p>
          </section>

          {property.amenities?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-serif text-charcoal-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((a) => (
                  <div key={a} className="text-sm text-charcoal-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500" /> {a}
                  </div>
                ))}
              </div>
            </section>
          )}

          {emi && (
            <section className="mb-10 bg-sand-100/40 p-6">
              <h2 className="text-lg font-serif text-charcoal-900 mb-2">EMI Estimate</h2>
              <p className="text-sm text-charcoal-600 mb-1">
                Estimated at 8.5% interest over 20 years, assuming 80% loan-to-value:
              </p>
              <p className="text-2xl font-serif text-terracotta-600">{formatINR(emi)} / month</p>
            </section>
          )}
        </div>

        {/* Sidebar: agent + schedule visit */}
        <div className="space-y-6">
          {property.agent && (
            <div className="bg-white border border-stone-100 p-6">
              <p className="section-label mb-3">Listed By</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-charcoal-900 text-white flex items-center justify-center font-serif">
                  {property.agent.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal-900">{property.agent.name}</p>
                  <p className="text-xs text-charcoal-500">{property.agent.specialization}</p>
                </div>
              </div>
              <div className="space-y-2">
                {property.agent.phone && (
                  <a href={`tel:${property.agent.phone}`} className="btn-secondary w-full">
                    <Phone className="w-4 h-4" /> {property.agent.phone}
                  </a>
                )}
                {property.agent.email && (
                  <a href={`mailto:${property.agent.email}`} className="btn-ghost w-full justify-center">
                    <Mail className="w-4 h-4" /> Email agent
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-100 p-6">
            <p className="section-label mb-4">Schedule a Visit</p>
            <form onSubmit={handleScheduleVisit} className="space-y-3">
              <input
                type="date"
                required
                value={visitForm.scheduledDate}
                onChange={(e) => setVisitForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                className="input-field"
              />
              <input
                type="time"
                required
                value={visitForm.scheduledTime}
                onChange={(e) => setVisitForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                className="input-field"
              />
              <Button type="submit" className="w-full">
                <Calendar className="w-4 h-4" /> Request Visit
              </Button>
              {visitStatus && <p className="text-xs text-charcoal-500 mt-2">{visitStatus}</p>}
              {!user && (
                <p className="text-xs text-charcoal-500">
                  <Link to="/login" className="text-terracotta-600 underline">Sign in</Link> to schedule a visit
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
