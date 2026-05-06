import ReactECharts from 'echarts-for-react';

interface QuadrantProps {
  data: { x: number; y: number; size: number; name: string; health: number }[];
}

export function Quadrant({ data }: QuadrantProps) {
  const healthColors: Record<number, string> = {
    1: '#ef4444',
    2: '#f97316',
    3: '#eab308',
    4: '#3b82f6',
    5: '#22c55e'
  };

  const option = {
    tooltip: {
      trigger: 'item'
    },
    xAxis: {
      type: 'value',
      name: '影响力',
      min: 0,
      max: 100,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '健康度',
      min: 0,
      max: 100,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        type: 'scatter',
        data: data.map(d => ({
          value: [d.x, d.y, d.size],
          name: d.name,
          symbolSize: d.size / 10,
          itemStyle: {
            color: healthColors[d.health]
          }
        }))
      }
    ],
    graphic: [
      {
        type: 'line',
        left: 'center',
        top: 'middle',
        shape: { x1: 0, y1: -200, x2: 0, y2: 200 },
        lineStyle: { stroke: '#e5e7eb', lineWidth: 1 }
      },
      {
        type: 'line',
        left: 'center',
        top: 'middle',
        shape: { x1: -300, y1: 0, x2: 300, y2: 0 },
        lineStyle: { stroke: '#e5e7eb', lineWidth: 1 }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '400px' }} />;
}
