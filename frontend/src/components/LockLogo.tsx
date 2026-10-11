import { lazy, Suspense } from "react";

import LockLogoFallback from "@/components/LockLogoFallback";
import {
  LOCK_LOGO_LAYOUTS,
  type LockLogoSize,
} from "@/components/lock-logo-layout";

const AnimatedLockLogo = lazy(
  () => import("@/components/AnimatedLockLogo"),
);

interface LockLogoProps {
  label?: string;
  size?: LockLogoSize;
}

const LockLogo = ({
  label = "Password Manager logo",
  size = "default",
}: LockLogoProps) => {
  const { frameClassName } = LOCK_LOGO_LAYOUTS[size];

  return (
    <Suspense
      fallback={
        <div className={frameClassName} role="img" aria-label={label}>
          <LockLogoFallback />
        </div>
      }
    >
      <AnimatedLockLogo label={label} size={size} />
    </Suspense>
  );
};

export default LockLogo;
