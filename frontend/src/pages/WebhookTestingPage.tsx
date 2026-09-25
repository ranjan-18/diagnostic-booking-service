import React from 'react';
import { WebhookPlayground } from '../components/payment';

export const WebhookTestingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Interactive Webhook Testing Suite
        </h1>
        <p className="text-sm text-slate-500">
          Simulate asynchronous payment processor webhook callbacks and verify atomic database idempotency.
        </p>
      </div>

      <WebhookPlayground />
    </div>
  );
};
