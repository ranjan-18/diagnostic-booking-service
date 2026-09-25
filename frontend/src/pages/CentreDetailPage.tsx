import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Activity, Calendar, ArrowLeft } from 'lucide-react';
import { centresApi, parseApiError } from '../api';
import { DiagnosticCentre, DiagnosticTest } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Button, Card, LoadingScreen } from '../components/common';
import { BookingModal } from '../components/booking';

export const CentreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [centre, setCentre] = useState<DiagnosticCentre | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);

  useEffect(() => {
    if (!id) return;
    centresApi
      .getCentreById(Number(id))
      .then((data) => setCentre(data))
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setIsLoading(false));
  }, [id, showError]);

  const handleBookClick = (test: DiagnosticTest) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/centres/${id}` } } });
      return;
    }
    setSelectedTest(test);
    setIsBookingModalOpen(true);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading centre details..." />;
  }

  if (!centre) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Diagnostic Centre Not Found</h2>
        <Link to="/catalog">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to all diagnostic centres
        </Link>
      </div>

      {/* Centre Profile Header Banner */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-300 bg-brand-500/20 px-3 py-1 rounded-full border border-brand-500/30 uppercase tracking-wide">
              {centre.location} Diagnostic Facility
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{centre.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-700/60 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span>{centre.address || 'Central Healthcare Facility'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span>{centre.phone || '+91-11-2345-6789'}</span>
          </div>
        </div>
      </Card>

      {/* Tests Offered */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Available Diagnostic Tests</h2>
          <p className="text-xs text-slate-500">All tests performed in-house at {centre.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centre.tests?.map((test) => (
            <Card key={test.id} hoverEffect className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-brand-700 text-base">
                    {formatCurrency(test.price)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{test.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {test.description || 'Routine diagnostic evaluation with digital report delivery.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleBookClick(test)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                >
                  Book for {formatCurrency(test.price)}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        test={selectedTest}
        centre={centre}
        onBookingSuccess={() => {
          navigate('/bookings');
        }}
      />
    </div>
  );
};
