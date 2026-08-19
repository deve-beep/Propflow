import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { appointmentService } from '../../services/resources';
import { formatDate } from '../../utils/format';
import { Badge, PageLoader, EmptyState } from '../../components/ui/Primitives';

const STATUS_TONE = { REQUESTED: 'default', CONFIRMED: 'success', COMPLETED: 'dark', CANCELLED: 'danger' };

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    appointmentService
      .list()
      .then(({ data }) => setAppointments(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (id, status) => {
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    await appointmentService.updateStatus(id, { status });
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-serif text-charcoal-900 mb-6">Appointments</h1>

      {appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="Visit requests will appear here." />
      ) : (
        <div className="bg-white border border-stone-100 divide-y divide-stone-50">
          {appointments.map((appt) => (
            <div key={appt._id} className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-charcoal-900">{appt.property?.title}</p>
                <p className="text-xs text-charcoal-500">
                  {appt.customer?.name} · {formatDate(appt.scheduledDate)} at {appt.scheduledTime}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[appt.status]}>{appt.status}</Badge>
                {appt.status === 'REQUESTED' && (
                  <button onClick={() => handleStatus(appt._id, 'CONFIRMED')} className="text-xs text-terracotta-600 underline">
                    Confirm
                  </button>
                )}
                {appt.status === 'CONFIRMED' && (
                  <button onClick={() => handleStatus(appt._id, 'COMPLETED')} className="text-xs text-charcoal-600 underline">
                    Mark completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
