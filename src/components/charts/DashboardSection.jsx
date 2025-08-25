import React from 'react';
import LightboxCard from '@/components/ui/LightboxCard';
import LineTile from '@/components/charts/LineTile';

const sleepData = [
  { x: '2025-08-23T23:00:00Z', y: 7.2 },
  { x: '2025-08-24T23:00:00Z', y: 6.4 },
];

const bgData = [
  { x: '2025-08-24T08:00:00Z', value_mgdl: 105 },
  { x: '2025-08-24T09:00:00Z', value_mgdl: 132 },
];

const migraineData = [
  { x: 'Mon', y: 0 },
  { x: 'Tue', y: 1 },
  { x: 'Wed', y: 0 },
];

export default function DashboardSection({ sleepData, bgData, migraineData }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
      <LightboxCard kind="sleep" title="Sleep (hrs)">
        <LineTile data={sleepData} yDomain={['auto','auto']} />
      </LightboxCard>

      <LightboxCard kind="bg" title="Blood Glucose (mg/dL)">
        <LineTile data={bgData} yDomain={[40, 250]} />
      </LightboxCard>

      <LightboxCard kind="migraine" title="Migraine Frequency">
        <LineTile data={migraineData} yDomain={['auto','auto']} />
      </LightboxCard>
    </div>
  );
}