import ReactECharts from 'echarts-for-react';

interface RadarDualProps {
  ecommerceData: number[];
  lifestyleData: number[];
  indicators: string[];
}

export function RadarDual({ ecommerceData, lifestyleData, indicators }: RadarDualProps) {
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: ['电商', '生服'],
      bottom: 0
    },
    radar: {
      indicator: indicators.map((name) => ({
        name,
        max: 100
      })),
      center: ['50%', '55%'],
      radius: '65%'
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: ecommerceData,
            name: '电商',
            itemStyle: { color: '#2A6DF4' },
            areaStyle: { opacity: 0.3 }
          },
          {
            value: lifestyleData,
            name: '生服',
            itemStyle: { color: '#7B5BF5' },
            areaStyle: { opacity: 0.3 }
          }
        ]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '400px' }} />;
}
