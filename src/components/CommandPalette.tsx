import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useProducts } from "@/hooks/useProducts";
import { useProductFeedback } from "@/hooks/useProductFeedback";
import {
  Package,
  LayoutDashboard,
  Brain,
  MessageSquare,
  FileText,
  Settings,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RefreshCw,
  BarChart3,
  Globe,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommandPaletteProps {
  onOpenAI?: () => void;
  onOpenUpload?: () => void;
  onTriggerSync?: () => void;
}

export function CommandPalette({ onOpenAI, onOpenUpload, onTriggerSync }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  
  const { data: products = [] } = useProducts();
  const { data: feedback = [] } = useProductFeedback();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Also support "/" for quick search (when not in an input)
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.product_type?.toLowerCase().includes(search.toLowerCase()) ||
    product.region?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  // Get risk status
  const getProductStatus = (product: typeof products[0]) => {
    const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
    const riskBand = readiness?.risk_band;
    if (riskBand === "high") return { icon: AlertTriangle, color: "text-destructive" };
    if (riskBand === "medium") return { icon: TrendingUp, color: "text-warning" };
    return { icon: CheckCircle2, color: "text-success" };
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search products, actions, or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          {onOpenAI && (
            <CommandItem onSelect={() => runCommand(onOpenAI)}>
              <Brain className="mr-2 h-4 w-4 text-purple-500" />
              <span>Ask AI a Question</span>
              <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
          )}
          {onOpenUpload && (
            <CommandItem onSelect={() => runCommand(onOpenUpload)}>
              <Upload className="mr-2 h-4 w-4 text-blue-500" />
              <span>Upload Documents</span>
              <CommandShortcut>⌘U</CommandShortcut>
            </CommandItem>
          )}
          {onTriggerSync && (
            <CommandItem onSelect={() => runCommand(onTriggerSync)}>
              <RefreshCw className="mr-2 h-4 w-4 text-green-500" />
              <span>Sync AI Knowledge Base</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Products */}
        {filteredProducts.length > 0 && (
          <CommandGroup heading="Products">
            {filteredProducts.map((product) => {
              const status = getProductStatus(product);
              const StatusIcon = status.icon;
              const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
              
              return (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => runCommand(() => navigate(`/product/${product.id}`))}
                >
                  <Package className="mr-2 h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{product.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {product.lifecycle_stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {readiness?.readiness_score && (
                      <Badge variant="secondary" className="text-xs">
                        {readiness.readiness_score}%
                      </Badge>
                    )}
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                </CommandItem>
              );
            })}
            {products.length > 5 && (
              <CommandItem 
                onSelect={() => runCommand(() => {
                  navigate("/");
                  // Could scroll to products section
                })}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="text-muted-foreground">
                  View all {products.length} products...
                </span>
              </CommandItem>
            )}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            navigate("/");
            // Scroll to analytics section
            setTimeout(() => {
              document.querySelector('[value="analytics"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, 100);
          })}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            navigate("/");
            setTimeout(() => {
              document.querySelector('[value="regional"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, 100);
          })}>
            <Globe className="mr-2 h-4 w-4" />
            <span>Regional Performance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            navigate("/");
            setTimeout(() => {
              document.querySelector('[value="feedback"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, 100);
          })}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Feedback Intelligence</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            navigate("/");
            setTimeout(() => {
              document.querySelector('[value="ai"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, 100);
          })}>
            <Brain className="mr-2 h-4 w-4" />
            <span>AI Insights</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Info */}
        <CommandGroup heading="Info">
          <CommandItem disabled>
            <Users className="mr-2 h-4 w-4" />
            <span>{products.length} Products</span>
          </CommandItem>
          <CommandItem disabled>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>{feedback.length} Feedback Items</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Export a button trigger for the command palette
export function CommandPaletteTrigger() {
  return (
    <button
      onClick={() => {
        // Trigger the keyboard shortcut
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded-md border bg-background hover:bg-accent transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

