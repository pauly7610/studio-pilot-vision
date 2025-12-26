import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Accessibility, Eye, Contrast, Check, Zap, Type } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export function AccessibilityToolbar() {
  const { 
    highContrastMode, 
    toggleHighContrast, 
    colorBlindMode, 
    setColorBlindMode,
    reducedMotion,
    toggleReducedMotion,
    textSize,
    setTextSize
  } = useAccessibility();

  const colorBlindModes = [
    { value: "none", label: "Standard Colors", description: "Default color scheme" },
    { value: "protanopia", label: "Protanopia", description: "Red-blind friendly" },
    { value: "deuteranopia", label: "Deuteranopia", description: "Green-blind friendly" },
    { value: "tritanopia", label: "Tritanopia", description: "Blue-blind friendly" },
  ] as const;

  const textSizes = [
    { value: "normal", label: "Normal", description: "Default text size" },
    { value: "large", label: "Large", description: "18px base size" },
    { value: "extra-large", label: "Extra Large", description: "20px base size" },
  ] as const;

  // Count active accessibility settings
  const activeCount = [
    highContrastMode,
    colorBlindMode !== "none",
    reducedMotion,
    textSize !== "normal"
  ].filter(Boolean).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          aria-label="Accessibility options"
        >
          <Accessibility className="h-4 w-4" aria-hidden="true" />
          Accessibility
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Accessibility Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* High Contrast Toggle */}
        <DropdownMenuItem 
          onClick={toggleHighContrast}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4" aria-hidden="true" />
            <span>High Contrast Mode</span>
          </div>
          {highContrastMode && (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          )}
        </DropdownMenuItem>

        {/* Reduced Motion Toggle */}
        <DropdownMenuItem 
          onClick={toggleReducedMotion}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span>Reduced Motion</span>
          </div>
          {reducedMotion && (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {/* Text Size Selection */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground flex items-center gap-2">
          <Type className="h-3 w-3" aria-hidden="true" />
          Text Size
        </DropdownMenuLabel>
        
        <DropdownMenuRadioGroup 
          value={textSize} 
          onValueChange={(value: "normal" | "large" | "extra-large") => setTextSize(value)}
        >
          {textSizes.map((size) => (
            <DropdownMenuRadioItem 
              key={size.value} 
              value={size.value}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{size.label}</span>
                <span className="text-xs text-muted-foreground">{size.description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        
        {/* Color Blind Mode Selection */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground flex items-center gap-2">
          <Eye className="h-3 w-3" aria-hidden="true" />
          Color Vision Mode
        </DropdownMenuLabel>
        
        <DropdownMenuRadioGroup 
          value={colorBlindMode} 
          onValueChange={(value: "none" | "protanopia" | "deuteranopia" | "tritanopia") => setColorBlindMode(value)}
        >
          {colorBlindModes.map((mode) => (
            <DropdownMenuRadioItem 
              key={mode.value} 
              value={mode.value}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{mode.label}</span>
                <span className="text-xs text-muted-foreground">{mode.description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <p className="mb-1">Keyboard shortcuts:</p>
          <ul className="space-y-0.5 text-[10px]">
            <li>• Tab: Navigate forward</li>
            <li>• Shift+Tab: Navigate back</li>
            <li>• Enter/Space: Activate</li>
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
