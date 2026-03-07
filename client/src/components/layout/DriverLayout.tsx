import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Truck, ArrowLeft, LogOut } from "lucide-react";

interface DriverLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  backUrl?: string;
  mapNumber?: string;
}

export function DriverLayout({ children, title, showBack, backUrl, mapNumber }: DriverLayoutProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // Basic driver logout (clear states if needed, then redirect)
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 z-50 bg-accent text-accent-foreground shadow-md">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && backUrl ? (
              <Link href={backUrl} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            ) : (
              <div className="p-2 -ml-2">
                <Truck className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">{title}</h1>
              {mapNumber && (
                <p className="text-xs text-accent-foreground/70 font-medium">Mapa: {mapNumber}</p>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 flex flex-col pb-24">
        {children}
      </main>
    </div>
  );
}
