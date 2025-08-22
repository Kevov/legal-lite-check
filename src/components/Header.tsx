import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/legal-lite-check/" className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Small Claims Helper</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant={location.pathname === "/legal-lite-check/eligibility" ? "default" : "ghost"}
              asChild
            >
              <Link to="/legal-lite-check/eligibility">
                Eligibility Checker
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname === "/legal-lite-check/resources" ? "default" : "ghost"}
              asChild
            >
              <Link to="/legal-lite-check/resources">
                Resources
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;