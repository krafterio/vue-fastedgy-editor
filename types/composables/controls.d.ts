/**
 * Lends [controls] to everything mounted under here, brick by brick.
 *
 * It **adds to** what is already lent rather than replacing it: a package that
 * dresses two bricks and an application that dresses a third stack up, and the
 * nearer one wins a brick they both dress.
 *
 * @param {Partial<typeof defaultRichTextControls>} [controls]
 */
export function provideRichTextControls(controls?: Partial<typeof defaultRichTextControls>): void;
/**
 * The bricks in force, whether an application lent any or not.
 *
 * Stateless on purpose: what has state is the editor, and an editor hands its
 * own to its own subtree. Two editors on a page share these and share nothing
 * else.
 *
 * @returns {typeof defaultRichTextControls}
 */
export function useRichTextControls(): typeof defaultRichTextControls;
/**
 * The six bricks a document draws its own furniture with.
 *
 * Each one is an intention, never an appearance: `kind` says what a button is
 * for, `tooltip` what a tappable means, and neither says how it looks. What
 * ships here carries the behaviour and none of the looks, so an application
 * dresses the brick it cares about and leaves the other five alone.
 */
export const defaultRichTextControls: Readonly<{
    tappable: {
        new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<Readonly<import("vue").ExtractPropTypes<{
            onTap: {
                type: FunctionConstructor;
                default: null;
            };
            active: {
                type: BooleanConstructor;
                default: boolean;
            };
            radius: {
                type: NumberConstructor;
                default: null;
            };
            tooltip: {
                type: StringConstructor;
                default: string;
            };
        }>> & Readonly<{}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, import("vue").PublicProps, {
            onTap: Function;
            radius: number;
            active: boolean;
            tooltip: string;
        }, true, {}, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, {}, any, import("vue").ComponentProvideOptions, {
            P: {};
            B: {};
            D: {};
            C: {};
            M: {};
            Defaults: {};
        }, Readonly<import("vue").ExtractPropTypes<{
            onTap: {
                type: FunctionConstructor;
                default: null;
            };
            active: {
                type: BooleanConstructor;
                default: boolean;
            };
            radius: {
                type: NumberConstructor;
                default: null;
            };
            tooltip: {
                type: StringConstructor;
                default: string;
            };
        }>> & Readonly<{}>, {}, {}, {}, {}, {
            onTap: Function;
            radius: number;
            active: boolean;
            tooltip: string;
        }>;
        __isFragment?: never;
        __isTeleport?: never;
        __isSuspense?: never;
    } & import("vue").ComponentOptionsBase<Readonly<import("vue").ExtractPropTypes<{
        onTap: {
            type: FunctionConstructor;
            default: null;
        };
        active: {
            type: BooleanConstructor;
            default: boolean;
        };
        radius: {
            type: NumberConstructor;
            default: null;
        };
        tooltip: {
            type: StringConstructor;
            default: string;
        };
    }>> & Readonly<{}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, {
        onTap: Function;
        radius: number;
        active: boolean;
        tooltip: string;
    }, {}, string, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, import("vue").ComponentProvideOptions> & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps & (new () => {
        $slots: {
            default?: (props: {}) => any;
        };
    });
    picker: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        label: {
            type: StringConstructor;
            default: string;
        };
        options: {
            type: ArrayConstructor;
            default: () => never[];
        };
        selected: {
            type: (StringConstructor | NumberConstructor | null)[];
            default: null;
        };
        onSelect: {
            type: FunctionConstructor;
            default: null;
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        label: {
            type: StringConstructor;
            default: string;
        };
        options: {
            type: ArrayConstructor;
            default: () => never[];
        };
        selected: {
            type: (StringConstructor | NumberConstructor | null)[];
            default: null;
        };
        onSelect: {
            type: FunctionConstructor;
            default: null;
        };
    }>> & Readonly<{}>, {
        label: string;
        options: unknown[];
        selected: string | number | null;
        onSelect: Function;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    button: {
        new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<Readonly<import("vue").ExtractPropTypes<{
            label: {
                type: StringConstructor;
                default: string;
            };
            onTap: {
                type: FunctionConstructor;
                default: null;
            };
            kind: {
                type: StringConstructor;
                default: string;
            };
        }>> & Readonly<{}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, import("vue").PublicProps, {
            label: string;
            onTap: Function;
            kind: string;
        }, true, {}, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, {}, any, import("vue").ComponentProvideOptions, {
            P: {};
            B: {};
            D: {};
            C: {};
            M: {};
            Defaults: {};
        }, Readonly<import("vue").ExtractPropTypes<{
            label: {
                type: StringConstructor;
                default: string;
            };
            onTap: {
                type: FunctionConstructor;
                default: null;
            };
            kind: {
                type: StringConstructor;
                default: string;
            };
        }>> & Readonly<{}>, {}, {}, {}, {}, {
            label: string;
            onTap: Function;
            kind: string;
        }>;
        __isFragment?: never;
        __isTeleport?: never;
        __isSuspense?: never;
    } & import("vue").ComponentOptionsBase<Readonly<import("vue").ExtractPropTypes<{
        label: {
            type: StringConstructor;
            default: string;
        };
        onTap: {
            type: FunctionConstructor;
            default: null;
        };
        kind: {
            type: StringConstructor;
            default: string;
        };
    }>> & Readonly<{}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, {
        label: string;
        onTap: Function;
        kind: string;
    }, {}, string, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, import("vue").ComponentProvideOptions> & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps & (new () => {
        $slots: {
            default?: (props: {}) => any;
        };
    });
    field: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        label: {
            type: StringConstructor;
            default: string;
        };
        placeholder: {
            type: StringConstructor;
            default: string;
        };
        leading: {
            type: (ObjectConstructor | FunctionConstructor)[];
            default: null;
        };
        autofocus: {
            type: BooleanConstructor;
            default: boolean;
        };
        modelValue: {
            type: import("vue").PropType<string>;
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
        "update:modelValue": (value: string) => any;
    }, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        label: {
            type: StringConstructor;
            default: string;
        };
        placeholder: {
            type: StringConstructor;
            default: string;
        };
        leading: {
            type: (ObjectConstructor | FunctionConstructor)[];
            default: null;
        };
        autofocus: {
            type: BooleanConstructor;
            default: boolean;
        };
        modelValue: {
            type: import("vue").PropType<string>;
        };
    }>> & Readonly<{
        "onUpdate:modelValue"?: ((value: string) => any) | undefined;
    }>, {
        label: string;
        placeholder: string;
        leading: Function | Record<string, any>;
        autofocus: boolean;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    menu: {
        new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<Readonly<import("vue").ExtractPropTypes<{
            actions: {
                type: ArrayConstructor;
                default: () => never[];
            };
            label: {
                type: StringConstructor;
                default: string;
            };
        }>> & Readonly<{}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, import("vue").PublicProps, {
            label: string;
            actions: unknown[];
        }, true, {}, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, {}, any, import("vue").ComponentProvideOptions, {
            P: {};
            B: {};
            D: {};
            C: {};
            M: {};
            Defaults: {};
        }, Readonly<import("vue").ExtractPropTypes<{
            actions: {
                type: ArrayConstructor;
                default: () => never[];
            };
            label: {
                type: StringConstructor;
                default: string;
            };
        }>> & Readonly<{}>, {}, {}, {}, {}, {
            label: string;
            actions: unknown[];
        }>;
        __isFragment?: never;
        __isTeleport?: never;
        __isSuspense?: never;
    } & import("vue").ComponentOptionsBase<Readonly<import("vue").ExtractPropTypes<{
        actions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        label: {
            type: StringConstructor;
            default: string;
        };
    }>> & Readonly<{}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, {
        label: string;
        actions: unknown[];
    }, {}, string, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, import("vue").ComponentProvideOptions> & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps & (new () => {
        $slots: {
            default?: (props: {}) => any;
        };
    });
    placeholder: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        width: {
            type: (StringConstructor | NumberConstructor)[];
            default: string;
        };
        height: {
            type: (StringConstructor | NumberConstructor)[];
            default: number;
        };
        radius: {
            type: NumberConstructor;
            default: number;
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        width: {
            type: (StringConstructor | NumberConstructor)[];
            default: string;
        };
        height: {
            type: (StringConstructor | NumberConstructor)[];
            default: number;
        };
        radius: {
            type: NumberConstructor;
            default: number;
        };
    }>> & Readonly<{}>, {
        width: string | number;
        height: string | number;
        radius: number;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}>;
//# sourceMappingURL=controls.d.ts.map