import { renderHook, act } from '@testing-library/react'
import { useDebounce, usePagination } from '@/hooks'

describe('Hooks', () => {
  describe('useDebounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return initial value', () => {
      const { result } = renderHook(() => useDebounce('initial', 500))
      expect(result.current).toBe('initial')
    })

    it('should update value after delay', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: 'initial' },
      })

      // Update prop
      rerender({ value: 'updated' })
      
      // Before delay, value should still be initial
      expect(result.current).toBe('initial')

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // After delay, value should be updated
      expect(result.current).toBe('updated')
    })
  })

  describe('usePagination', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => usePagination())
      
      expect(result.current.page).toBe(1)
      expect(result.current.limit).toBe(10)
    })

    it('handles next and prev page', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.nextPage()
      })
      expect(result.current.page).toBe(2)

      act(() => {
        result.current.prevPage()
      })
      expect(result.current.page).toBe(1)

      // Should not go below 1
      act(() => {
        result.current.prevPage()
      })
      expect(result.current.page).toBe(1)
    })

    it('handles jump to specific page and reset', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToPage(5)
      })
      expect(result.current.page).toBe(5)

      act(() => {
        result.current.reset()
      })
      expect(result.current.page).toBe(1)
    })
  })
})
