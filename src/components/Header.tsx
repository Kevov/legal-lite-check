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
            <img src="public/logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">ClaimRunner AI</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant={location.pathname === "/" ? "default" : "ghost"}
              asChild
            >
              <Link to="/">
                Home
              </Link>
            </Button>
            <Button 
              variant={location.pathname === "/features/" ? "default" : "ghost"}
              asChild
            >
              <Link to="/features/">
                Features
              </Link>
            </Button>
            <Button 
              variant={location.pathname === "/team/" ? "default" : "ghost"}
              asChild
            >
              <Link to="/team/">
                Team
              </Link>
            </Button>
            <Button 
              variant={location.pathname === "/legal-lite-check/" ? "default" : "ghost"}
              asChild
            >
              <Link to="/legal-lite-check/">
                Prototype Eligibility Checker
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname === "/legal-lite-check/resources" ? "default" : "ghost"}
              asChild
            >
              <Link to="/legal-lite-check/resources">
                Small Claims 101
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;