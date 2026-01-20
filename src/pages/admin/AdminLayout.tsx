import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Briefcase, Package, ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin/cases', label: 'Cases', icon: Briefcase },
  { href: '/admin/solucoes', label: 'Soluções', icon: Package },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">Admin Panel</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Gerenciamento de dados</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-muted/30 overflow-x-auto">
        <div className="container px-3 sm:px-4">
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                  location.pathname === item.href
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
