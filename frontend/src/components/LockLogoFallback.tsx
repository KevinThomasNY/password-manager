import fallbackLogo from "@/assets/navbar_icon.svg";

const LockLogoFallback = () => (
  <div
    className="absolute inset-0 flex items-center justify-center"
    aria-hidden="true"
  >
    <img src={fallbackLogo} alt="" className="h-3/4 w-auto" />
  </div>
);

export default LockLogoFallback;
