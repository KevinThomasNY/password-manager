import { lazy, Suspense } from "react";
import { Home } from "lucide-react";
import { Link } from "react-router";

import Logo from "@/assets/navbar_icon.svg";
import { Button } from "@/components/ui/button";

const AnimatedLockLogo = lazy(
  () => import("@/components/AnimatedLockLogo"),
);

const LogoFallback = () => (
  <div className="mx-auto flex h-28 w-32 items-center justify-center sm:h-32 sm:w-36">
    <img
      src={Logo}
      alt="Password Manager logo"
      className="h-16 w-16"
    />
  </div>
);

const NotFound = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center text-card-foreground shadow-sm sm:p-10">
        <Suspense fallback={<LogoFallback />}>
          <AnimatedLockLogo />
        </Suspense>
        <p className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The page you’re looking for doesn’t exist or may have moved. Let’s get
          you back home.
        </p>
        <Button asChild className="mt-8 w-full sm:w-auto">
          <Link to="/dashboard">
            <Home aria-hidden="true" />
            Back to home
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
