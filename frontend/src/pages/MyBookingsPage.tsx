import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, RefreshCw, Activity, CheckCircle2, Clock, AlertTriangle, Ban } from 'lucide-react';
import { bookingsApi, parseApiError } from '../api';
import { Booking, BookingStatus, DiagnosticCentre, DiagnosticTest } from '../types';
import { useNotification } from '../context/NotificationContext';
import { Button, Card, LoadingScreen } from '../components/common';
import { BookingCard, BookingModal } from '../components/booking';
import { PaymentModal } from '../components/payment';

export const MyBookingsPage: React.FC = () => {
  const { showError } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<BookingStatus | 'ALL'>('ALL');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  // Rebooking Modal State
  const [isRebookModalOpen, setIsRebookModalOpen] = useState(false);
  const [rebookTest, setRebookTest] = useState<DiagnosticTest | null>(null);
  const [rebookCentre, setRebookCentre] = useState<DiagnosticCentre | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await bookingsApi.getBookings();
      setBookings(data.results);
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handlePayClick = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setIsPaymentModalOpen(true);
  };

  const handleRebookClick = (booking: Booking) => {
    setRebookTest(booking.test);
    setRebookCentre(booking.centre);
    setIsRebookModalOpen(true);
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      failed: bookings.filter((b) => b.status === 'FAILED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
    };
  }, [bookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    if (selectedFilter === 'ALL') return bookings;
    return bookings.filter((b) => b.status === selectedFilter);
  }, [bookings, selectedFilter]);

  if (isLoading && bookings.length === 0) {
    return <LoadingScreen message="Loading your diagnostic bookings..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Diagnostic Bookings</h1>
          <p className="text-sm text-slate-500">
            Track status transitions, simulate payments, rebook or cancel appointments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchBookings} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Link to="/catalog">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Book New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar with all 5 status indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked</span>
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending Pay</span>
            <span className="text-xl font-black text-amber-800">{stats.pending}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Confirmed</span>
            <span className="text-xl font-black text-emerald-800">{stats.confirmed}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Failed / Action</span>
            <span className="text-xl font-black text-rose-800">{stats.failed}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cancelled</span>
            <span className="text-xl font-black text-slate-700">{stats.cancelled}</span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {(['ALL', 'PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'] as const).map((status) => {
          const isActive = selectedFilter === status;
          const count =
            status === 'ALL'
              ? stats.total
              : status === 'PENDING'
              ? stats.pending
              : status === 'CONFIRMED'
              ? stats.confirmed
              : status === 'FAILED'
              ? stats.failed
              : stats.cancelled;

          return (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{status}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3">
          <Calendar className="w-10 h-10 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-base">No bookings found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {selectedFilter === 'ALL'
              ? "You haven't scheduled any diagnostic tests yet. Browse our catalog to book one."
              : `No bookings currently in '${selectedFilter}' status.`}
          </p>
          {selectedFilter === 'ALL' && (
            <Link to="/catalog">
              <Button variant="primary" size="sm" className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
                Browse Diagnostic Tests
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPayClick={handlePayClick}
              onRebookClick={handleRebookClick}
              onStatusUpdated={fetchBookings}
            />
          ))}
        </div>
      )}

      {/* Payment Simulation Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={selectedBookingForPayment}
        onPaymentComplete={() => {
          fetchBookings();
        }}
      />

      {/* Rebooking Modal */}
      <BookingModal
        isOpen={isRebookModalOpen}
        onClose={() => setIsRebookModalOpen(false)}
        test={rebookTest}
        centre={rebookCentre}
        onBookingSuccess={() => {
          fetchBookings();
        }}
      />
    </div>
  );
};
