import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, ArrowRight } from 'lucide-react';
import { propertyService, appointmentService } from '../../services/resources';
import { PropertyCard } from '../../components/property/PropertyCard';
import { formatDate } from '../../utils/format';
import { Badge } from '../../components/ui/Primitives';

export default function CustomerDashboardPage() {
  const [favorites, setFavorites] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    propertyService.listFavorites().then(({ data }) => setFavorites(data.data.slice(0, 3)));
    appointmentService.list({ limit: 5 }).then(({ data }) => setAppointments(data.data));
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-serif text-charcoal-900">My Account</h1>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif text-charcoal-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-terracotta-500" /> Saved Properties
          </h2>
          <Link to="/account/favorites" className="text-xs text-terracotta-600 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {favorites.length === 0 ? (
          <p className="text-sm text-charcoal-500">No saved properties yet. Browse listings and tap the heart icon to save them here.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {favorites.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-serif text-charcoal-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-terracotta-500" /> Upcoming Appointments
        </h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-charcoal-500">No appointments scheduled.</p>
        ) : (
          <div className="bg-white border border-stone-100 divide-y divide-stone-50">
            {appointments.map((appt) => (
              <div key={appt._id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-900">{appt.property?.title}</p>
                  <p className="text-xs text-charcoal-500">
                    {formatDate(appt.scheduledDate)} at {appt.scheduledTime}
                  </p>
                </div>
                <Badge tone={appt.status === 'CONFIRMED' ? 'success' : appt.status === 'CANCELLED' ? 'danger' : 'default'}>
                  {appt.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
