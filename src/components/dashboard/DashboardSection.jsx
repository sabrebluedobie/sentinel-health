// src/components/dashboard/DashboardSection.jsx
import LightboxCard from '@/components/ui/LightboxCard';
import LineTile from '@/components/charts/LineTile';

export function DashboardSection({ sleepData, bgData, migraineData }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
      <LightboxCard kind="sleep" title="Sleep (hrs)">
        <LineTile data={sleepData} />
      </LightboxCard>

      <LightboxCard kind="bg" title="Blood Glucose (mg/dL)">
        <LineTile data={bgData} />
      </LightboxCard>

      <LightboxCard kind="migraine" title="Migraine Frequency">
        <LineTile data={migraineData} />
      </LightboxCard>
    </div>
  );
}