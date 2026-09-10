<script setup>
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'reka-ui';

/**
 * What a menu does is the same work in every application: placing itself,
 * closing on Escape and on a click outside, handing the focus back where it came
 * from, and saying what it is to a screen reader. What it looks like is not, and
 * none of it is here.
 *
 * The root is `DropdownMenuRoot`, which renders no element at all: left to fall
 * through, a class or a position written by whoever mounts the menu would land
 * nowhere. They go on the trigger, which is the part that is actually there.
 */
defineOptions({ inheritAttrs: false });

defineProps({
    /** `{ label, icon, destructive, separated, onTap }`, in the order they read. */
    actions: { type: Array, default: () => [] },

    label: { type: String, default: '' },
});
</script>

<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger v-bind="$attrs" data-slot="editor-menu" :aria-label="label || undefined">
            <slot />
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
            <DropdownMenuContent data-slot="editor-menu-content">
                <template v-for="(action, at) in actions" :key="action.label">
                    <DropdownMenuSeparator v-if="action.separated && at > 0" />

                    <DropdownMenuItem :data-destructive="action.destructive || undefined" @select="action.onTap?.()">
                        <component :is="action.icon" v-if="action.icon" />
                        <span>{{ action.label }}</span>
                    </DropdownMenuItem>
                </template>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
