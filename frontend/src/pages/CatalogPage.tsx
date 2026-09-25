import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Activity, Calendar } from 'lucide-react';
import { centresApi, parseApiError } from '../api';
import { DiagnosticCentre, DiagnosticTest } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Button, Card, Input, LoadingScreen } from '../components/common';
import { BookingModal } from '../components/booking';

export const CatalogPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [centres, setCentres] = useState<DiagnosticCentre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(searchParams.get('centre') || '');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | 'default'>('default');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<DiagnosticCentre | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [testsRes, centresRes] = await Promise.all([
          centresApi.getTests({ page_size: 100 }),
          centresApi.getCentres({ page_size: 50 }),
        ]);
        setTests(testsRes.results);
        setCentres(centresRes.results);
      } catch (err) {
        showError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showError]);

  // Handle Book Click
  const handleBookClick = (test: DiagnosticTest) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/catalog' } } });
      return;
    }
    const centre = centres.find((c) => c.id === test.centre);
    if (!centre) {
      showError('Unable to identify centre for this test.');
      return;
    }
    setSelectedTest(test);
    setSelectedCentre(centre);
    setIsBookingModalOpen(true);
  };

  // Filtered & Sorted Tests
  const filteredTests = useMemo(() => {
    return tests
      .filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCentre = selectedCentreId ? t.centre === Number(selectedCentreId) : true;
        return matchesSearch && matchesCentre;
      })
      .sort((a, b) => {
        if (priceSort === 'asc') return parseFloat(a.price) - parseFloat(b.price);
        if (priceSort === 'desc') return parseFloat(b.price) - parseFloat(a.price);
        return 0;
      });
  }, [tests, searchTerm, selectedCentreId, priceSort]);

  if (isLoading) {
    return <LoadingScreen message="Loading diagnostic catalog..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Diagnostic Tests Catalog
        </h1>
        <p className="text-sm text-slate-500">
          Search and book from our comprehensive catalog of verified pathology & radiology tests.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search tests (e.g., CBC, MRI, Blood Sugar, Thyroid)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Centre Filter */}
          <div>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Diagnostic Centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          </div>

          {/* Price Sorting */}
          <div>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="default">Sort by: Relevance</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || selectedCentreId || priceSort !== 'default') && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong>{filteredTests.length}</strong> of {tests.length} diagnostic tests
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCentreId('');
                setPriceSort('default');
              }}
              className="text-brand-600 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3">
          <Activity className="w-10 h-10 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-base">No diagnostic tests found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Try adjusting your search criteria or choosing a different diagnostic centre.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const centre = centres.find((c) => c.id === test.centre);
            return (
              <Card key={test.id} hoverEffect className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-100">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="font-black text-lg text-brand-700">
                      {formatCurrency(test.price)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {test.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {test.description || 'Comprehensive laboratory evaluation with certified doctor consultation.'}
                    </p>
                  </div>

                  {centre && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="truncate">
                        <strong>{centre.name}</strong> • {centre.location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleBookClick(test)}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  >
                    Book Appointment
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        test={selectedTest}
        centre={selectedCentre}
        onBookingSuccess={() => {
          navigate('/bookings');
        }}
      />
    </div>
  );
};
