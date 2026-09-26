import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/constants';


export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">EVE Healthcare</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Certified diagnostic healthcare platform for reliable lab testing, appointment scheduling,
              and real-time booking lifecycle management.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalog" className="hover:text-white transition-colors">
                  Diagnostic Tests
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-white transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/webhook-sandbox" className="hover:text-white transition-colors">
                  Webhook Sandbox
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer / API Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Developer APIs</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`${API_BASE_URL || ''}/api/docs/`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Swagger UI Docs
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL || ''}/api/schema/`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  OpenAPI Schema
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL || ''}/admin/`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Django Admin
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© {new Date().getFullYear()} EVE Healthcare Diagnostic Services. Built for Reliability & Precision.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with care</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Healthcare Diagnostics</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
