import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial value immediately and updates after delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 400 },
    });
    expect(result.current).toBe('a');

    rerender({ value: 'ab', delay: 400 });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(result.current).toBe('ab');
  });
});
