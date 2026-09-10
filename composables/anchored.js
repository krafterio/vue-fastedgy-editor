import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Where a floating surface sits, read from what it hangs on.
 *
 * Against the viewport rather than against the block it points at: an editor
 * that scrolls, one that is capped and scrolls inside itself, and one that grows
 * with its content are three different parents, and a surface that measured
 * against any of them would be right in one case out of three.
 *
 * The surface belongs to the editor that opened it, which is why the listeners
 * are posted on mounting and taken back on unmounting, and why nothing here is
 * shared: two editors on a page each hold their own.
 *
 * @param {() => DOMRect|null} measure - The rectangle to hang on, or `null` to hide
 * @returns {{ rect: import('vue').Ref<DOMRect|null>, follow: () => void }}
 */
export function useAnchoredRect(measure) {
    const rect = ref(null);

    // Measuring reaches into the DOM the editor drew, and what is asked for may
    // have gone between the transaction and this line. A surface that cannot say
    // where it sits hides; it never takes the editor down with it.
    const follow = () => {
        try {
            rect.value = measure();
        } catch {
            rect.value = null;
        }
    };

    onMounted(() => {
        window.addEventListener('scroll', follow, true);
        window.addEventListener('resize', follow);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('scroll', follow, true);
        window.removeEventListener('resize', follow);
    });

    return { rect, follow };
}

/**
 * The style a surface sits at, above or below what it hangs on.
 *
 * @param {DOMRect|null} rect
 * @param {{ gap?: number, place?: 'above'|'below' }} [options]
 * @returns {Record<string, string>}
 */
export function anchoredStyle(rect, options = {}) {
    if (!rect) {
        return { display: 'none' };
    }

    const gap = options.gap ?? 8;
    const above = options.place === 'above';

    return {
        position: 'fixed',
        left: `${Math.round(rect.left)}px`,
        top: above ? `${Math.round(rect.top - gap)}px` : `${Math.round(rect.bottom + gap)}px`,
        transform: above ? 'translateY(-100%)' : undefined,
    };
}
