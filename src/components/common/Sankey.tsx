import ReactECharts from 'echarts-for-react';

interface SankeyProps {
  nodes: { name: string }[];
  links: { source: string; target: string; value: number }[];
}

export function Sankey({ nodes, links }: SankeyProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'sankey',
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency'
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        },
        colors: ['#2A6DF4', '#7B5BF5', '#1F8A70']
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '400px' }} />;
}
