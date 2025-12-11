import { ref, computed, watch, nextTick, onMounted, onUnmounted, type Ref } from 'vue';
import type { Cell } from '../types';
import { GAME_CONFIG } from '../config';

interface GhostItem {
    value: number;
    index: number;
}

export function useGridVirtualization(cells: Ref<Cell[]>) {
    // --- REFS & STATE ---
    const gridContainerRef = ref<HTMLElement | null>(null);
    const gridRef = ref<HTMLElement | null>(null);
    const scrollTop = ref(0);
    const containerHeight = ref(800);

    const rowHeight = ref(50);
    const headerHeight = ref(54);
    const bottomBarHeight = ref(54);

    const rowPaddingBottom = ref(4);
    const ghostPaddingTotal = ref(8);

    let isTicking = false;

    const BUFFER = 6;

    const topGhosts = ref<(GhostItem | null)[]>(Array(GAME_CONFIG.ROW_SIZE).fill(null));
    const bottomGhosts = ref<(GhostItem | null)[]>(Array(GAME_CONFIG.ROW_SIZE).fill(null));

    // --- RESIZE OBSERVER ---
    let resizeObserver: ResizeObserver | null = null;

    // --- MEASUREMENTS ---
    const measureDimensions = () => {
        const topSentinel = document.getElementById('ghost-top-sentinel');
        const bottomSentinel = document.getElementById('ghost-bottom-sentinel');

        if (topSentinel) {
            headerHeight.value = topSentinel.offsetHeight;

            // Читаем стили
            const style = window.getComputedStyle(topSentinel);
            const pt = parseFloat(style.paddingTop) || 0;
            const pb = parseFloat(style.paddingBottom) || 0;

            ghostPaddingTotal.value = pt + pb;
        }

        if (bottomSentinel) {
            bottomBarHeight.value = bottomSentinel.offsetHeight;
        }

        let realRowHeight = 0;

        if (gridRef.value && gridRef.value.firstElementChild) {
            const firstRow = gridRef.value.firstElementChild as HTMLElement;
            realRowHeight = firstRow.offsetHeight;

            const rowStyle = window.getComputedStyle(firstRow);
            rowPaddingBottom.value = parseFloat(rowStyle.paddingBottom) || 0;

        } else if (topSentinel) {
            realRowHeight = topSentinel.offsetHeight;
        }

        if (realRowHeight > 0 && Math.abs(realRowHeight - rowHeight.value) > 0.5) {
            rowHeight.value = realRowHeight;
            if (headerHeight.value === 0) headerHeight.value = realRowHeight;
        }
    };

    // --- VIRTUAL SCROLL COMPUTED ---
    const chunkedRows = computed(() => {
        const result = [];
        const rawCells = cells.value;
        for (let i = 0; i < rawCells.length; i += GAME_CONFIG.ROW_SIZE) {
            result.push({
                items: rawCells.slice(i, i + GAME_CONFIG.ROW_SIZE).map((c, localIdx) => ({ cell: c, originalIndex: i + localIdx })),
                rowIndex: i / GAME_CONFIG.ROW_SIZE
            });
        }
        return result;
    });

    const visibleRange = computed(() => {
        if (rowHeight.value === 0) return { start: 0, end: 10 };

        const scrolledContent = Math.max(0, scrollTop.value - headerHeight.value);
        const start = Math.floor(scrolledContent / rowHeight.value);
        const visibleCount = Math.ceil(containerHeight.value / rowHeight.value);

        return {
            start: Math.max(0, start - BUFFER),
            end: Math.min(chunkedRows.value.length, start + visibleCount + BUFFER)
        };
    });

    const visibleRows = computed(() => {
        const { start, end } = visibleRange.value;
        return chunkedRows.value.slice(start, end);
    });

    const spacerTop = computed(() => visibleRange.value.start * rowHeight.value);
    const spacerBottom = computed(() => (chunkedRows.value.length - visibleRange.value.end) * rowHeight.value);

    // --- GHOSTS LOGIC ---
    const updateGhosts = () => {
        if (cells.value.length === 0 || rowHeight.value === 0) return;

        const offsetTop = rowHeight.value + rowPaddingBottom.value;

        const gridScrollY = scrollTop.value - headerHeight.value;
        const topRowIndex = Math.floor((gridScrollY + offsetTop) / rowHeight.value) + 1;

        for (let col = 0; col < GAME_CONFIG.ROW_SIZE; col++) {
            let foundItem: GhostItem | null = null;
            const startIdx = ((topRowIndex - 1) * GAME_CONFIG.ROW_SIZE) + col;
            for (let i = startIdx; i >= 0; i -= GAME_CONFIG.ROW_SIZE) {
                if (i >= cells.value.length) continue;
                const cell = cells.value[i];
                if (cell && cell.status !== 'crossed' && !cell.isDeleting) {
                    foundItem = { value: cell.value, index: i };
                    break;
                }
            }
            topGhosts.value[col] = foundItem;
        }

        const scrollHeight = gridContainerRef.value?.scrollHeight || 0;
        const clientHeight = gridContainerRef.value?.clientHeight || 0;
        const isAtBottom = (Math.ceil(scrollTop.value) + clientHeight) >= (scrollHeight - 5);

        if (isAtBottom) {
            bottomGhosts.value.fill(null);
        } else {
            const viewportBottomInGrid = (scrollTop.value + containerHeight.value) - bottomBarHeight.value - headerHeight.value;
            const offsetBottom = rowHeight.value - ghostPaddingTotal.value;
            const bottomRowIndex = Math.floor((viewportBottomInGrid - offsetBottom) / rowHeight.value);

            for (let col = 0; col < GAME_CONFIG.ROW_SIZE; col++) {
                let foundItem: GhostItem | null = null;
                const startIdx = ((bottomRowIndex + 1) * GAME_CONFIG.ROW_SIZE) + col;
                for (let i = startIdx; i < cells.value.length; i += GAME_CONFIG.ROW_SIZE) {
                    if (i < 0) continue;
                    const cell = cells.value[i];
                    if (cell && cell.status !== 'crossed' && !cell.isDeleting) {
                        foundItem = { value: cell.value, index: i };
                        break;
                    }
                }
                bottomGhosts.value[col] = foundItem;
            }
        }
    };

    // --- ACTIONS ---
    const handleScroll = (e: Event) => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                const target = e.target as HTMLElement;
                if (target) {
                    scrollTop.value = target.scrollTop;
                }
                isTicking = false;
            });
            isTicking = true;
        }
    };

    const scrollToCell = (index: number) => {
        const container = gridContainerRef.value;
        if (container && rowHeight.value > 0) {
            const rowIndex = Math.floor(index / GAME_CONFIG.ROW_SIZE);
            let targetPos = (rowIndex * rowHeight.value) + headerHeight.value - (containerHeight.value / 2) + (rowHeight.value / 2);
            targetPos = Math.max(0, targetPos);
            container.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
    };

    const scrollToBottom = () => {
        const container = gridContainerRef.value;
        if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }

    // --- LIFECYCLE ---
    watch([scrollTop, cells], updateGhosts, { flush: 'post' });

    onMounted(() => {
        if (gridContainerRef.value) {
            containerHeight.value = gridContainerRef.value.clientHeight;
            resizeObserver = new ResizeObserver(() => {
                if (gridContainerRef.value) {
                    containerHeight.value = gridContainerRef.value.clientHeight;
                    measureDimensions();
                    updateGhosts();
                }
            });
            resizeObserver.observe(gridContainerRef.value);
            setTimeout(measureDimensions, 200);
        }
    });

    onUnmounted(() => {
        if (resizeObserver) resizeObserver.disconnect();
    });

    return {
        gridContainerRef,
        gridRef,
        handleScroll,
        visibleRows,
        spacerTop,
        spacerBottom,
        topGhosts,
        bottomGhosts,
        hasTopGhosts: computed(() => topGhosts.value.some(v => v !== null)),
        hasBottomGhosts: computed(() => bottomGhosts.value.some(v => v !== null)),
        measureDimensions,
        updateGhosts,
        scrollToCell,
        scrollToBottom
    };
}