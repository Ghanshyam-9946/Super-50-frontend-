import { useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ScoreRing({ score = 0, size = 180 }) {
  const data = {
    datasets: [{
      data: [score, 100 - score],
      backgroundColor: [
        score >= 75 ? '#10b981' : score >= 50 ? '#7c3aed' : score >= 25 ? '#f59e0b' : '#ef4444',
        'rgba(255,255,255,0.05)',
      ],
      borderWidth: 0,
      cutout: '78%',
    }],
  };

  const options = {
    responsive: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    animation: { animateRotate: true, duration: 1500, easing: 'easeInOutQuart' },
  };

  const color = score >= 75 ? '#10b981' : score >= 50 ? '#7c3aed' : score >= 25 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Average' : 'Needs Work';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Doughnut data={data} options={options} width={size} height={size} />
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.18, fontWeight: 900, color, lineHeight: 1 }}>
          {Math.round(score)}
        </div>
        <div style={{ fontSize: size * 0.07, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
