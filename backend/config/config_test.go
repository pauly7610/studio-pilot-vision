package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	// Clear env vars to test defaults
	os.Unsetenv("PORT")
	os.Unsetenv("ENVIRONMENT")
	
	cfg := Load()
	
	if cfg.Port == "" {
		t.Error("Port should have a default value")
	}
	
	if cfg.Environment == "" {
		t.Error("Environment should have a default value")
	}
}

func TestLoad_FromEnv(t *testing.T) {
	// Set test env vars
	os.Setenv("PORT", "9999")
	os.Setenv("ENVIRONMENT", "test")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("ENVIRONMENT")
	}()
	
	cfg := Load()
	
	if cfg.Port != "9999" {
		t.Errorf("expected Port=9999, got %s", cfg.Port)
	}
	
	if cfg.Environment != "test" {
		t.Errorf("expected Environment=test, got %s", cfg.Environment)
	}
}

