import React, { createContext, useContext, useState, useEffect } from "react";

type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";
type TextSize = "normal" | "large" | "extra-large";

interface AccessibilityContextType {
  highContrastMode: boolean;
  toggleHighContrast: () => void;
  colorBlindMode: ColorBlindMode;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>("none");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSize>("normal");
  const [announcement, setAnnouncement] = useState("");

  // Load saved preferences
  useEffect(() => {
    const savedHighContrast = localStorage.getItem("highContrastMode") === "true";
    const savedColorBlindMode = (localStorage.getItem("colorBlindMode") as ColorBlindMode) || "none";
    const savedReducedMotion = localStorage.getItem("reducedMotion") === "true";
    const savedTextSize = (localStorage.getItem("textSize") as TextSize) || "normal";
    
    // Check system preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    setHighContrastMode(savedHighContrast);
    setColorBlindMode(savedColorBlindMode);
    setReducedMotion(savedReducedMotion || prefersReducedMotion);
    setTextSizeState(savedTextSize);
    
    // Apply initial classes
    if (savedHighContrast) {
      document.documentElement.classList.add("high-contrast");
    }
    if (savedColorBlindMode !== "none") {
      document.documentElement.classList.add(`colorblind-${savedColorBlindMode}`);
    }
    if (savedReducedMotion || prefersReducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    }
    if (savedTextSize === "large") {
      document.documentElement.classList.add("large-text");
    } else if (savedTextSize === "extra-large") {
      document.documentElement.classList.add("extra-large-text");
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrastMode;
    setHighContrastMode(newValue);
    localStorage.setItem("highContrastMode", String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add("high-contrast");
      announceToScreenReader("High contrast mode enabled");
    } else {
      document.documentElement.classList.remove("high-contrast");
      announceToScreenReader("High contrast mode disabled");
    }
  };

  const handleSetColorBlindMode = (mode: ColorBlindMode) => {
    // Remove previous colorblind class
    document.documentElement.classList.remove(
      "colorblind-protanopia",
      "colorblind-deuteranopia", 
      "colorblind-tritanopia"
    );
    
    setColorBlindMode(mode);
    localStorage.setItem("colorBlindMode", mode);
    
    // Add new class if not "none"
    if (mode !== "none") {
      document.documentElement.classList.add(`colorblind-${mode}`);
    }
    
    const modeNames = {
      none: "Standard colors",
      protanopia: "Protanopia mode (red-blind friendly)",
      deuteranopia: "Deuteranopia mode (green-blind friendly)",
      tritanopia: "Tritanopia mode (blue-blind friendly)"
    };
    
    announceToScreenReader(`Color mode changed to ${modeNames[mode]}`);
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem("reducedMotion", String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add("reduced-motion");
      announceToScreenReader("Reduced motion enabled");
    } else {
      document.documentElement.classList.remove("reduced-motion");
      announceToScreenReader("Reduced motion disabled");
    }
  };

  const handleSetTextSize = (size: TextSize) => {
    // Remove previous text size classes
    document.documentElement.classList.remove("large-text", "extra-large-text");
    
    setTextSizeState(size);
    localStorage.setItem("textSize", size);
    
    // Add new class
    if (size === "large") {
      document.documentElement.classList.add("large-text");
    } else if (size === "extra-large") {
      document.documentElement.classList.add("extra-large-text");
    }
    
    const sizeNames = {
      normal: "Normal text size",
      large: "Large text size",
      "extra-large": "Extra large text size"
    };
    
    announceToScreenReader(`Text size changed to ${sizeNames[size]}`);
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncement(message);
    // Clear after a short delay to allow multiple announcements
    setTimeout(() => setAnnouncement(""), 100);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrastMode,
        toggleHighContrast,
        colorBlindMode,
        setColorBlindMode: handleSetColorBlindMode,
        reducedMotion,
        toggleReducedMotion,
        textSize,
        setTextSize: handleSetTextSize,
        announceToScreenReader,
      }}
    >
      {children}
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}
