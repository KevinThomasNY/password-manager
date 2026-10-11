export type LockLogoSize = "default" | "compact";

export const LOCK_LOGO_LAYOUTS: Record<
  LockLogoSize,
  { frameClassName: string; canvasGutterClassName: string }
> = {
  default: {
    frameClassName:
      "relative mx-auto h-28 w-32 shrink-0 pointer-events-none sm:h-32 sm:w-36",
    canvasGutterClassName: "absolute -inset-y-2 inset-x-0",
  },
  compact: {
    frameClassName: "relative h-12 w-12 shrink-0 pointer-events-none",
    canvasGutterClassName: "absolute -inset-y-1 inset-x-0",
  },
};
