import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Calendar, ArrowRight, Terminal } from 'lucide-react';
import { centresApi } from '../api';
import { DiagnosticCentre } from '../types';
import { Button, Card, Spinner } from '../components/common';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [centres, setCentres] = useState<DiagnosticCentre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    centresApi
      .getCentres()
      .then((res) => setCentres(res.results.slice(0, 3)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const features = [
    {
      icon: <Activity className="w-6 h-6 text-brand-600" />,
      title: 'Certified Diagnostic Tests',
      desc: 'Access verified pathology & radiology tests across accredited laboratory centres.',
    },
    {
      icon: <Calendar className="w-6 h-6 text-emerald-600" />,
      title: 'Real-time Booking Engine',
      desc: 'Schedule appointment slots with instant confirmation and price snapshot protection.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
      title: 'Atomic Payment Lifecycle',
      desc: 'Separation of booking & payment domains with simulated gateways and idempotent webhooks.',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            EVE Healthcare Diagnostic Booking Service
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Precision Diagnostic Lab Tests,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-emerald-300 bg-clip-text text-transparent">
              Simplified & Verified.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Book certified diagnostic appointments across premier health centres. Features JWT authentication, server-side price protection, and idempotent payment reconciliation.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/catalog">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Explore Test Catalog
              </Button>
            </Link>
            <Link to="/webhook-sandbox">
              <Button
                size="lg"
                variant="glass"
                leftIcon={<Terminal className="w-5 h-5 text-brand-400" />}
              >
                Webhook Sandbox
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Core Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <Card key={i} hoverEffect className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </Card>
        ))}
      </section>

      {/* Featured Centres Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Partner Diagnostic Centres</h2>
            <p className="text-sm text-slate-500">Accredited laboratories with comprehensive testing catalogs</p>
          </div>
          <Link to="/catalog">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {centres.map((centre) => (
              <Card key={centre.id} hoverEffect className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                      {centre.location}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {centre.test_count || 5} tests available
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{centre.name}</h3>
                  <p className="text-xs text-slate-500">{centre.address || 'Central Healthcare Facility'}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{centre.phone || '+91-11-2345-6789'}</span>
                  <Link to={`/centres/${centre.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Tests
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
