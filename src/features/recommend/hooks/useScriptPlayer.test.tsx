import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LARK_DOC_TITLE, DEFAULT_LARK_DOC_URL } from '../scripts/lark-merchant-insight.script';
import { useRecommendStore } from './useRecommendStore';
import { __resetScriptPlayerForTests, useScriptPlayer } from './useScriptPlayer';

describe('useScriptPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetScriptPlayerForTests();
    useRecommendStore.getState().reset();
  });

  afterEach(() => {
    __resetScriptPlayerForTests();
    vi.useRealTimers();
  });

  it('同一 session 的 phase 会按 parse -> recommend -> gap -> done 自动推进', () => {
    const { unmount } = renderHook(() => useScriptPlayer());

    act(() => {
      useRecommendStore.getState().startSession(DEFAULT_LARK_DOC_URL, DEFAULT_LARK_DOC_TITLE);
    });

    act(() => {
      vi.advanceTimersByTime(14_599);
    });
    expect(useRecommendStore.getState().phase).toBe('parse');
    expect(useRecommendStore.getState().requirement).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(useRecommendStore.getState().phase).toBe('recommend');
    expect(useRecommendStore.getState().requirement?.docTitle).toBe(DEFAULT_LARK_DOC_TITLE);
    expect(useRecommendStore.getState().thinking).toHaveLength(6);

    act(() => {
      vi.advanceTimersByTime(13_600);
    });
    expect(useRecommendStore.getState().phase).toBe('gap');
    expect(useRecommendStore.getState().recommends).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(5_600);
    });
    expect(useRecommendStore.getState().phase).toBe('done');
    expect(useRecommendStore.getState().gaps.length).toBeGreaterThan(0);

    unmount();
  });

  it('manualGateAfterParse = true 时写入 requirement 后停在 parse', () => {
    const { unmount } = renderHook(() => useScriptPlayer({ manualGateAfterParse: true }));

    act(() => {
      useRecommendStore.getState().startSession(DEFAULT_LARK_DOC_URL, DEFAULT_LARK_DOC_TITLE);
    });

    act(() => {
      vi.advanceTimersByTime(14_600);
    });

    const state = useRecommendStore.getState();
    expect(state.phase).toBe('parse');
    expect(state.manualGateAfterParse).toBe(true);
    expect(state.requirement?.docUrl).toBe(DEFAULT_LARK_DOC_URL);
    expect(state.recommends).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(useRecommendStore.getState().phase).toBe('parse');
    expect(useRecommendStore.getState().gaps).toEqual([]);

    unmount();
  });

  it('同一 session:phase 重复挂载时不会重复注册播放', () => {
    const first = renderHook(() => useScriptPlayer());
    const second = renderHook(() => useScriptPlayer());

    act(() => {
      useRecommendStore.getState().startSession(DEFAULT_LARK_DOC_URL, DEFAULT_LARK_DOC_TITLE);
    });

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    const state = useRecommendStore.getState();
    expect(state.phase).toBe('parse');
    expect(state.thinking).toHaveLength(1);
    expect(state.thinking[0].id).toBe('parse-1');

    first.unmount();
    second.unmount();
  });
});
