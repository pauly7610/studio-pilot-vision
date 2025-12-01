import React, { createContext, useContext, useState, useEffect } from "react";

interface AccessibilityContextType {
  highContrastMode: boolean;
  toggleHighContrast: () => void;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  setColorBlindMode: (mode: "none" | "protanopia" | "deuteranopia" | "tritanopia") => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<"none" | "protanopia" | "deuteranopia" | "tritanopia">("none");
  const [announcement, setAnnouncement] = useState("");

  // Load saved preferences
  useEffect(() => {
    const savedHighContrast = localStorage.getItem("highContrastMode") === "true";
    const savedColorBlindMode = localStorage.getItem("colorBlindMode") as any || "none";
    
    setHighContrastMode(savedHighContrast);
    setColorBlindMode(savedColorBlindMode);
    
    if (savedHighContrast) {
      document.documentElement.classList.add("high-contrast");
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

  const handleSetColorBlindMode = (mode: "none" | "protanopia" | "deuteranopia" | "tritanopia") => {
    setColorBlindMode(mode);
    localStorage.setItem("colorBlindMode", mode);
    
    const modeNames = {
      none: "Standard colors",
      protanopia: "Protanopia mode (red-blind)",
      deuteranopia: "Deuteranopia mode (green-blind)",
      tritanopia: "Tritanopia mode (blue-blind)"
    };
    
    announceToScreenReader(`Color mode changed to ${modeNames[mode]}`);
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
