"""
Test Suite for Settings Validation
Tests Pydantic settings validation and configuration.
"""

import pytest
import os
from pydantic import ValidationError
from ai_insights.config import Settings, get_settings, reload_settings


class TestSettingsValidation:
    """Test Pydantic settings validation."""
    
    def test_missing_required_api_key_raises_error(self):
        """Missing GROQ_API_KEY should raise validation error."""
        # Temporarily remove the key
        original_key = os.environ.get("GROQ_API_KEY")
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
        
        try:
            with pytest.raises(ValidationError):
                Settings()
        finally:
            # Restore the key
            if original_key:
                os.environ["GROQ_API_KEY"] = original_key
    
    def test_valid_settings_load_successfully(self):
        """Valid settings should load without errors."""
        # Ensure required env var is set
        os.environ["GROQ_API_KEY"] = "test_key_123"
        
        settings = Settings()
        
        assert settings.groq_api_key == "test_key_123"
        assert settings.groq_model == "llama-3.3-70b-versatile"
    
    def test_default_values_applied(self):
        """Default values should be applied for optional settings."""
        os.environ["GROQ_API_KEY"] = "test_key"
        
        settings = Settings()
        
        assert settings.embedding_model == "sentence-transformers/all-MiniLM-L6-v2"
        assert settings.embedding_dim == 384
        assert settings.api.port == 8001
        assert settings.api.host == "0.0.0.0"
    
    def test_invalid_log_level_raises_error(self):
        """Invalid log level should raise validation error."""
        os.environ["GROQ_API_KEY"] = "test_key"
        os.environ["LOG_LEVEL"] = "INVALID"
        
        try:
            with pytest.raises(ValidationError):
                Settings()
        finally:
            if "LOG_LEVEL" in os.environ:
                del os.environ["LOG_LEVEL"]
    
    def test_valid_log_levels_accepted(self):
        """Valid log levels should be accepted."""
        os.environ["GROQ_API_KEY"] = "test_key"
        
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        
        for level in valid_levels:
            os.environ["LOG_LEVEL"] = level
            settings = Settings()
            assert settings.log_level == level
        
        if "LOG_LEVEL" in os.environ:
            del os.environ["LOG_LEVEL"]


class TestRetrievalSettings:
    """Test retrieval configuration validation."""
    
    def test_chunk_overlap_less_than_chunk_size(self):
        """Chunk overlap must be less than chunk size."""
        os.environ["GROQ_API_KEY"] = "test_key"
        os.environ["CHUNK_SIZE"] = "512"
        os.environ["CHUNK_OVERLAP"] = "600"  # Invalid: larger than chunk_size
        
        try:
            with pytest.raises(ValidationError):
                Settings()
        finally:
            if "CHUNK_SIZE" in os.environ:
                del os.environ["CHUNK_SIZE"]
            if "CHUNK_OVERLAP" in os.environ:
                del os.environ["CHUNK_OVERLAP"]
    
    def test_top_k_within_bounds(self):
        """top_k should be within valid range."""
        os.environ["GROQ_API_KEY"] = "test_key"
        
        settings = Settings()
        
        assert 1 <= settings.retrieval.top_k <= 20
    
    def test_similarity_threshold_within_bounds(self):
        """Similarity threshold should be between 0 and 1."""
        os.environ["GROQ_API_KEY"] = "test_key"
        
        settings = Settings()
        
        assert 0.0 <= settings.retrieval.similarity_threshold <= 1.0


class TestCogneeSettings:
    """Test Cognee-specific configuration."""
    
    def test_cognee_env_setup(self):
        """setup_cognee_env should set required environment variables."""
        os.environ["GROQ_API_KEY"] = "test_groq_key"
        os.environ["HUGGINGFACE_API_KEY"] = "test_hf_key"
        
        # Clear Cognee env vars
        for key in ["LLM_API_KEY", "EMBEDDING_API_KEY", "LLM_MODEL", "COGNEE_DATA_DIR"]:
            if key in os.environ:
                del os.environ[key]
        
        settings = Settings()
        settings.setup_cognee_env()
        
        assert os.environ["LLM_API_KEY"] == "test_groq_key"
        assert os.environ["EMBEDDING_API_KEY"] == "test_hf_key"
        assert os.environ["LLM_MODEL"] == "groq/llama-3.3-70b-versatile"
        assert os.environ["COGNEE_DATA_DIR"] == "./cognee_data"
        
        # Cleanup
        if "HUGGINGFACE_API_KEY" in os.environ:
            del os.environ["HUGGINGFACE_API_KEY"]


class TestSettingsSingleton:
    """Test global settings instance management."""
    
    def test_get_settings_returns_same_instance(self):
        """get_settings should return the same instance."""
        os.environ["GROQ_API_KEY"] = "test_key"
        
        settings1 = get_settings()
        settings2 = get_settings()
        
        assert settings1 is settings2
    
    def test_reload_settings_creates_new_instance(self):
        """reload_settings should create a new instance."""
        os.environ["GROQ_API_KEY"] = "test_key"
        
        settings1 = get_settings()
        settings2 = reload_settings()
        
        # Should be different instances
        assert settings1 is not settings2
