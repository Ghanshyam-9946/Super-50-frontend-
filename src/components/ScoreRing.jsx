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
        '#F1F5F9', // light gray for the empty portion in light mode
      ],
      borderWidth: 0,
      cutout: '80%',
      borderRadius: [10, 0], // rounded cap for the filled portion
    }],
  };

  const options = {
    responsive: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    animation: { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutQuart' },
  };

  const color = score >= 75 ? '#10b981' : score >= 50 ? '#7c3aed' : score >= 25 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Average' : 'Needs Work';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Doughnut data={data} options={options} width={size} height={size} />
      <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div style={{ fontSize: size * 0.22, fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
          {Math.round(score)}
        </div>
        <div style={{ fontSize: size * 0.08, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
