/**
 * Virtual List Component for efficient rendering of long lists
 * Only renders items that are visible in the viewport
 */

/* eslint-disable react-refresh/only-export-components */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';

export interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render above/below visible area */
  overscan?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /** Optional className for the container */
  className?: string;
  /** Optional style for the container */
  style?: React.CSSProperties;
  /** Callback when scroll position changes */
  onScroll?: (scrollTop: number) => void;
  /** Auto-scroll to bottom when new items are added */
  autoScrollToBottom?: boolean;
  /** Key extractor for items */
  keyExtractor?: (item: T, index: number) => string | number;
}

export interface VirtualListRef {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getScrollTop: () => number;
}

function VirtualListInner<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListRef>
) {
  const {
    items,
    itemHeight,
    containerHeight,
    overscan = 3,
    renderItem,
    className = '',
    style = {},
    onScroll,
    autoScrollToBottom = false,
    keyExtractor,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const prevItemsLengthRef = useRef(items.length);

  // Total height for scroll area - must be calculated before useMemo that uses it
  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1),
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Scroll methods
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!containerRef.current) return;

      let targetScrollTop: number;
      const itemTop = index * itemHeight;

      switch (align) {
        case 'center':
          targetScrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
          break;
        case 'end':
          targetScrollTop = itemTop - containerHeight + itemHeight;
          break;
        case 'start':
        default:
          targetScrollTop = itemTop;
      }

      containerRef.current.scrollTop = Math.max(
        0,
        Math.min(targetScrollTop, totalHeight - containerHeight)
      );
    },
    [itemHeight, containerHeight, totalHeight]
  );

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight - containerHeight;
    }
  }, [totalHeight, containerHeight]);

  const getScrollTop = useCallback(() => scrollTop, [scrollTop]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getScrollTop,
  }));

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (autoScrollToBottom && items.length > prevItemsLengthRef.current) {
      scrollToBottom();
    }
    prevItemsLengthRef.current = items.length;
  }, [items.length, autoScrollToBottom, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={handleScroll}
    >
      {/* Spacer to maintain scroll height */}
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {/* Render visible items */}
        {visibleItems.map((item, localIndex) => {
          const actualIndex = startIndex + localIndex;
          const key = keyExtractor
            ? keyExtractor(item, actualIndex)
            : actualIndex;

          const itemStyle: React.CSSProperties = {
            position: 'absolute',
            top: actualIndex * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          };

          return (
            <div key={key} style={itemStyle}>
              {renderItem(item, actualIndex, itemStyle)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Forward ref with generic type support
export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<VirtualListRef> }
) => React.ReactElement;

/**
 * Hook for virtual list calculations
 * Use this when you need more control over rendering
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan: number = 3
) {
  return useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1),
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);
}

export default VirtualList;
