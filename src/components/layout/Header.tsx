
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2 mr-6">
          <ReceiptText className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl hidden sm:inline-block">Smart Receipt Tracker</span>
          <span className="font-bold text-xl sm:hidden">SRT</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/" className="font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/dashboard" className="font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link to="/upload" className="font-medium transition-colors hover:text-primary">
            Upload Receipt
          </Link>
        </nav>
        
        <div className="ml-auto flex items-center gap-2">
          <Link to="/auth/login" className="hidden md:block">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link to="/auth/register" className="hidden md:block">
            <Button>Sign up</Button>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Menu"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="container md:hidden py-4 animate-fade-in">
          <nav className="flex flex-col gap-4">
            <Link 
              to="/" 
              className="font-medium py-2 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className="font-medium py-2 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/upload" 
              className="font-medium py-2 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Upload Receipt
            </Link>
            <div className="flex flex-col gap-2 mt-4">
              <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Sign up</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
