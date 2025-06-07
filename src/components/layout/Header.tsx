
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, ReceiptText, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

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
          {user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:scale-105 transition-transform duration-200">
                    <Avatar className="h-10 w-10 shadow-md border-2 border-primary/10">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url} 
                        alt="User profile" 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.email?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg border border-primary/10">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg mb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url} 
                        alt="User profile"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                        {user.email?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold text-sm truncate">
                          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📧</span>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-colors">
                    <NotificationSettings />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-3 p-3 text-destructive focus:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">🚪 Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link to="/auth/login" className="hidden md:block">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/auth/register" className="hidden md:block">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Toggle Menu" 
            className="md:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
              {user ? (
                <>
                  <NotificationSettings />
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50" 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Sign in</Button>
                  </Link>
                  <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
