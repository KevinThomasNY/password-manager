import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import axiosInstance from "@/api/axios-instance";
import { useToast } from "@/components/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import navbarIcon from "@/assets/navbar_icon.svg";
import ModeToggle from "@/components/ModeToggle";

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navLinks = [
    { name: "Home", path: "/dashboard" },
    { name: "Profile", path: "/dashboard/profile" },
  ];

  // Utility function for desktop link classes
  const getLinkClasses = (path: string) => {
    const baseClasses =
      "px-3 py-2 rounded-md text-sm font-medium transition-opacity";
    return location.pathname === path
      ? `${baseClasses} text-[#017603]`
      : `${baseClasses} text-black dark:text-white hover:text-indigo-500 dark:hover:text-indigo-500`;
  };

  // Utility function for mobile link classes
  const getMobileLinkClasses = (path: string) => {
    const baseClasses =
      "mt-8 px-4 py-2 text-lg font-medium rounded-md transition-opacity";
    return location.pathname === path
      ? `${baseClasses} text-[#017303]`
      : `${baseClasses} text-black dark:text-white hover:text-indigo-500 dark:hover:text-indigo-500`;
  };

  const handleLogout = async () => {
    try {
      const response = await axiosInstance.post("/users/logout");

      if (response.status === 200 && response.data?.status === "success") {
        toast({
          title: "Logout Successful",
          description: "You have successfully logged out.",
        });
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Logout Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="w-full bg-white dark:bg-black text-black dark:text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <img src={navbarIcon} alt="Navbar Icon" className="w-8 h-8 " />
            Password Manager
          </h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={getLinkClasses(link.path)}
              >
                {link.name}
              </Link>
            ))}
            {/* Theme Toggle */}
            <ModeToggle />
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              className="px-4 py-2 flex items-center gap-2 rounded-md text-sm font-medium transition-all text-gray-300 bg-indigo-600 hover:bg-indigo-800"
            >
              <LogOut className="w-5 h-5" /> Logout
            </Button>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="md:hidden bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="bg-white dark:bg-black text-black dark:text-white"
            >
              <SheetClose />

              {/* Mobile Navigation */}
              <nav className="flex flex-col items-center space-y-4 mt-4 px-4">
                {/* Theme Toggle */}
                <ModeToggle />
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={getMobileLinkClasses(link.path)}
                    onClick={() => setOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                {/* Logout Button */}
                <Button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="mt-8 px-12 py-2 text-lg font-medium rounded-md transition-all text-gray-300 bg-indigo-600 hover:bg-indigo-800"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
