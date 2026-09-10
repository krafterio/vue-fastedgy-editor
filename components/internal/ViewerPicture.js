import { defineComponent, h, resolveDirective, withDirectives } from 'vue';

/**
 * A picture in a document being read.
 *
 * A component of its own, and not a VNode built beside the others, because a
 * directive is applied **while a component renders**: attached to a node built
 * in a computed, `v-fetcher-src` never runs, the picture asks for the file with
 * no token, and an attachment comes back a 401.
 */
export const ViewerPicture = defineComponent({
    name: 'ViewerPicture',

    props: {
        src: { type: String, default: '' },
        alt: { type: String, default: '' },
        width: { type: Number, default: null },
        height: { type: Number, default: null },
    },

    setup(props) {
        const carries = resolveDirective('fetcher-src');

        return () => {
            const drawn = h('img', {
                src: props.src,
                alt: props.alt,
                width: props.width ?? undefined,
                height: props.height ?? undefined,
                'data-slot': 'editor-image',
            });

            return carries ? withDirectives(drawn, [[carries, undefined, undefined, { lazy: true }]]) : drawn;
        };
    },
});
