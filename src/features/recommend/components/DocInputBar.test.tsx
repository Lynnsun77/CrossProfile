import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocInputBar } from './DocInputBar';
import { useRecommendStore } from '../store/useRecommendStore';

describe('DocInputBar', () => {
  beforeEach(() => {
    useRecommendStore.getState().reset();
  });

  afterEach(() => {
    useRecommendStore.getState().reset();
    vi.useRealTimers();
  });

  it('空输入时按钮置灰为「开始生成」', () => {
    render(<DocInputBar />);
    const button = screen.getByRole('button', { name: '查询' });
    expect(button).toBeDisabled();
  });

  it('输入普通文本时按钮可点击，点击后 intent.source === manual 且 thinkingTask 被创建', () => {
    const onSubmit = vi.fn();
    render(<DocInputBar onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText('需求输入');

    act(() => {
      fireEvent.change(textarea, { target: { value: '帮我找 GMV 资产' } });
    });

    expect(useRecommendStore.getState().intent.text).toBe('帮我找 GMV 资产');
    expect(useRecommendStore.getState().intent.hasFeishuDoc).toBe(false);

    const button = screen.getByRole('button', { name: '查询' });
    expect(button).not.toBeDisabled();

    act(() => {
      fireEvent.click(button);
    });

    expect(onSubmit).toHaveBeenCalledWith('帮我找 GMV 资产');
  });

  it('粘贴飞书文档链接时识别提示出现，点击后 intent.source === feishu_doc', () => {
    const onSubmit = vi.fn();
    render(<DocInputBar onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText('需求输入');

    act(() => {
      fireEvent.change(textarea, {
        target: { value: 'https://bytedance.larkoffice.com/wiki/abc123' },
      });
    });

    expect(useRecommendStore.getState().intent.hasFeishuDoc).toBe(true);
    expect(screen.getByText('检测到飞书文档，将读取其内容')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '查询' }));
    });

    expect(onSubmit).toHaveBeenCalledWith('https://bytedance.larkoffice.com/wiki/abc123');
  });

  it('超过 2000 字时展示截断提示', () => {
    render(<DocInputBar />);
    const textarea = screen.getByLabelText('需求输入');
    const longText = 'a'.repeat(2100);

    act(() => {
      fireEvent.change(textarea, { target: { value: longText } });
    });

    expect(useRecommendStore.getState().intent.truncated).toBe(true);
    expect(screen.getByText(/内容过长，将截断/)).toBeInTheDocument();
  });

  it('传入目标和场景配置时渲染 chip，并支持清空与场景切换', () => {
    const onGoalsChange = vi.fn();
    const onSceneChange = vi.fn();
    render(
      <DocInputBar
        goalOptions={[
          { id: 'gmv', label: 'GMV' },
          { id: 'mac', label: 'MAC' },
        ]}
        selectedGoals={['mac']}
        onGoalsChange={onGoalsChange}
        scene="ecom_growth"
        onSceneChange={onSceneChange}
      />,
    );

    expect(screen.getByText('业务目标：')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GMV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MAC' })).toBeInTheDocument();
    expect(screen.getByText('策略场景：')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '清空' }));
    });
    expect(onGoalsChange).toHaveBeenCalledWith([]);
    expect(onSceneChange).toHaveBeenCalledWith('local_growth');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '电商用增' }));
    });
    expect(onSceneChange).toHaveBeenCalledWith('ecom_growth');
  });

  it('只保留单一查询按钮，不再渲染再次生成与用示例文档', () => {
    render(<DocInputBar />);

    expect(screen.getByRole('button', { name: '查询' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '再次生成' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '用示例文档' })).not.toBeInTheDocument();
  });
});
