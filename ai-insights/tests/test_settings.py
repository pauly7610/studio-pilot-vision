"""
Tests for ai_insights.config.settings module.

Tests the Settings Pydantic model and sub-configurations.
"""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError


class TestSettingsValidation:
    """Test main Settings class validation."""

    @pytest.fixture(autouse=True)
    def setup_env(self):
        """Ensure required env vars are set for testing."""
        with patch.dict(
            os.environ,
            {
                "GROQ_API_KEY": "test-groq-key-12345",
            },
            clear=False,
        ):
            yield

    def test_settings_loads_with_required_keys(self):
        """Should load settings when required keys are present."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key-123"}):
            settings = Settings()
            assert settings.groq_api_key == "test-key-123"

    def test_settings_requires_groq_api_key(self):
        """Should fail without GROQ_API_KEY."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {}, clear=True):
            # Remove all env vars
            env_backup = os.environ.copy()
            try:
                for key in list(os.environ.keys()):
                    if "GROQ" in key:
                        del os.environ[key]

                with pytest.raises(ValidationError):
                    Settings()
            finally:
                os.environ.update(env_backup)

    def test_default_values_applied(self):
        """Should apply default values for optional settings."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            settings = Settings()

            # Check actual default values from settings.py
            assert settings.groq_model == "llama-3.3-70b-versatile"
            assert "all-MiniLM-L6-v2" in settings.embedding_model
            assert settings.embedding_dim == 384
            assert settings.documents_path == "./documents"
            assert settings.log_level == "INFO"

    def test_huggingface_key_optional(self):
        """Should work without HuggingFace API key."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            settings = Settings()
            # huggingface_api_key is optional
            assert settings.huggingface_api_key is None or isinstance(
                settings.huggingface_api_key, str
            )


class TestCogneeSettings:
    """Test CogneeSettings sub-configuration."""

    def test_cognee_defaults(self):
        """Should have correct Cognee defaults."""
        from ai_insights.config.settings import CogneeSettings

        cognee = CogneeSettings()

        assert cognee.data_path == "./cognee_data"
        assert cognee.llm_model == "groq/llama-3.3-70b-versatile"
        assert cognee.llm_provider == "custom"
        assert cognee.llm_endpoint == "https://api.groq.com/openai/v1"
        # FastEmbed for local embeddings (no API calls)
        assert cognee.embedding_model == "BAAI/bge-small-en-v1.5"
        assert cognee.embedding_provider == "fastembed"
        assert cognee.embedding_endpoint is None  # Not needed for fastembed
        assert cognee.embedding_dimensions == 384
        assert cognee.vector_db_provider == "lancedb"
        assert cognee.graph_db_provider == "networkx"


class TestMilvusSettings:
    """Test MilvusSettings sub-configuration."""

    def test_milvus_defaults(self):
        """Should have correct Milvus defaults."""
        from ai_insights.config.settings import MilvusSettings

        milvus = MilvusSettings()

        assert milvus.mode == "lite"
        assert milvus.lite_path == "./milvus_data.db"
        assert milvus.host == "localhost"
        assert milvus.port == 19530
        assert milvus.collection == "studio_pilot_insights"


class TestRetrievalSettings:
    """Test RetrievalSettings sub-configuration."""

    def test_retrieval_defaults(self):
        """Should have correct retrieval defaults."""
        from ai_insights.config.settings import RetrievalSettings

        retrieval = RetrievalSettings()

        assert retrieval.top_k == 5
        assert retrieval.similarity_threshold == 0.7
        assert retrieval.chunk_size == 512
        assert retrieval.chunk_overlap == 50

    def test_top_k_bounds(self):
        """Should enforce top_k bounds [1, 20]."""
        from ai_insights.config.settings import RetrievalSettings

        # Valid values
        settings = RetrievalSettings(top_k=1)
        assert settings.top_k == 1

        settings = RetrievalSettings(top_k=20)
        assert settings.top_k == 20

        # Invalid values
        with pytest.raises(ValidationError):
            RetrievalSettings(top_k=0)

        with pytest.raises(ValidationError):
            RetrievalSettings(top_k=21)

    def test_similarity_threshold_bounds(self):
        """Should enforce similarity_threshold bounds [0.0, 1.0]."""
        from ai_insights.config.settings import RetrievalSettings

        # Valid values
        settings = RetrievalSettings(similarity_threshold=0.0)
        assert settings.similarity_threshold == 0.0

        settings = RetrievalSettings(similarity_threshold=1.0)
        assert settings.similarity_threshold == 1.0

        # Invalid values
        with pytest.raises(ValidationError):
            RetrievalSettings(similarity_threshold=-0.1)

        with pytest.raises(ValidationError):
            RetrievalSettings(similarity_threshold=1.1)

    def test_chunk_size_bounds(self):
        """Should enforce chunk_size bounds [128, 2048]."""
        from ai_insights.config.settings import RetrievalSettings

        # Valid values
        settings = RetrievalSettings(chunk_size=128)
        assert settings.chunk_size == 128

        settings = RetrievalSettings(chunk_size=2048)
        assert settings.chunk_size == 2048

        # Invalid values
        with pytest.raises(ValidationError):
            RetrievalSettings(chunk_size=127)

        with pytest.raises(ValidationError):
            RetrievalSettings(chunk_size=2049)

    def test_chunk_overlap_bounds(self):
        """Should enforce chunk_overlap bounds [0, 256]."""
        from ai_insights.config.settings import RetrievalSettings

        # Valid values
        settings = RetrievalSettings(chunk_overlap=0)
        assert settings.chunk_overlap == 0

        settings = RetrievalSettings(chunk_overlap=256)
        assert settings.chunk_overlap == 256

        # Invalid values
        with pytest.raises(ValidationError):
            RetrievalSettings(chunk_overlap=-1)

        with pytest.raises(ValidationError):
            RetrievalSettings(chunk_overlap=257)

    def test_chunk_overlap_less_than_chunk_size(self):
        """chunk_overlap should be less than chunk_size."""
        from ai_insights.config.settings import RetrievalSettings

        # Valid: overlap < size
        settings = RetrievalSettings(chunk_size=512, chunk_overlap=50)
        assert settings.chunk_overlap < settings.chunk_size

        # Note: The validator only triggers if chunk_overlap >= chunk_size
        # and both values are within their individual bounds
        # With default bounds, overlap max is 256 and size min is 128
        # So overlap >= size is only possible with size <= 256

        # This should fail because overlap >= size
        with pytest.raises(ValidationError):
            RetrievalSettings(chunk_size=128, chunk_overlap=128)

        with pytest.raises(ValidationError):
            RetrievalSettings(chunk_size=200, chunk_overlap=250)


class TestAPISettings:
    """Test APISettings sub-configuration."""

    def test_api_defaults(self):
        """Should have correct API defaults."""
        from ai_insights.config.settings import APISettings

        api = APISettings()

        assert api.host == "0.0.0.0"
        assert api.port == 8001

    def test_port_bounds(self):
        """Should enforce port bounds [1024, 65535]."""
        from ai_insights.config.settings import APISettings

        # Valid values
        settings = APISettings(port=1024)
        assert settings.port == 1024

        settings = APISettings(port=65535)
        assert settings.port == 65535

        # Invalid values
        with pytest.raises(ValidationError):
            APISettings(port=1023)

        with pytest.raises(ValidationError):
            APISettings(port=65536)


class TestLogLevelValidation:
    """Test log level validation."""

    def test_valid_log_levels(self):
        """Should accept valid log levels."""
        from ai_insights.config.settings import Settings

        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

        for level in valid_levels:
            with patch.dict(os.environ, {"GROQ_API_KEY": "test", "LOG_LEVEL": level}):
                settings = Settings()
                assert settings.log_level == level

    def test_log_level_case_insensitive(self):
        """Should accept log levels in any case."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test", "LOG_LEVEL": "debug"}):
            settings = Settings()
            assert settings.log_level == "DEBUG"

        with patch.dict(os.environ, {"GROQ_API_KEY": "test", "LOG_LEVEL": "Info"}):
            settings = Settings()
            assert settings.log_level == "INFO"

    def test_invalid_log_level_rejected(self):
        """Should reject invalid log levels."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test", "LOG_LEVEL": "INVALID"}):
            with pytest.raises(ValidationError):
                Settings()


class TestSetupCogneeEnv:
    """Test setup_cognee_env method."""

    def test_setup_cognee_env_sets_variables(self):
        """Should set Cognee environment variables."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-groq-key"}, clear=False):
            settings = Settings()

            # Clear any existing Cognee vars
            for var in ["LLM_API_KEY", "LLM_PROVIDER", "LLM_MODEL", "EMBEDDING_PROVIDER"]:
                os.environ.pop(var, None)

            settings.setup_cognee_env()

            assert os.environ.get("LLM_API_KEY") == "test-groq-key"
            assert os.environ.get("LLM_PROVIDER") == "custom"
            assert os.environ.get("LLM_MODEL") == "groq/llama-3.3-70b-versatile"
            assert os.environ.get("VECTOR_DB_PROVIDER") == "lancedb"
            # FastEmbed is the new default
            assert os.environ.get("EMBEDDING_PROVIDER") == "fastembed"

    def test_setup_cognee_env_respects_existing_vars(self):
        """Should NOT overwrite existing environment variables."""
        from ai_insights.config.settings import Settings

        # Pre-set env vars (simulating Render dashboard config)
        with patch.dict(os.environ, {
            "GROQ_API_KEY": "test-groq-key",
            "EMBEDDING_PROVIDER": "fastembed",  # User-set value
            "EMBEDDING_MODEL": "user-chosen-model",  # User-set value
            "LLM_PROVIDER": "user-llm-provider",  # User-set value
        }, clear=False):
            settings = Settings()
            settings.setup_cognee_env()

            # Should NOT overwrite user-set values
            assert os.environ.get("EMBEDDING_PROVIDER") == "fastembed"
            assert os.environ.get("EMBEDDING_MODEL") == "user-chosen-model"
            assert os.environ.get("LLM_PROVIDER") == "user-llm-provider"


class TestGetSettings:
    """Test get_settings singleton function."""

    def test_get_settings_returns_settings(self):
        """Should return Settings instance."""
        from ai_insights.config.settings import Settings, get_settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            settings = get_settings()
            assert isinstance(settings, Settings)

    def test_get_settings_returns_singleton(self):
        """Should return same instance on multiple calls."""
        import ai_insights.config.settings as settings_module

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            # Reset singleton
            settings_module._settings = None

            s1 = settings_module.get_settings()
            s2 = settings_module.get_settings()

            assert s1 is s2


class TestReloadSettings:
    """Test reload_settings function."""

    def test_reload_settings_creates_new_instance(self):
        """Should create new Settings instance."""
        import ai_insights.config.settings as settings_module

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            s1 = settings_module.get_settings()
            s2 = settings_module.reload_settings()

            # Should be different instances
            assert s1 is not s2


class TestSubConfigurationIntegration:
    """Test sub-configurations within main Settings."""

    def test_settings_has_sub_configs(self):
        """Settings should include all sub-configurations."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            settings = Settings()

            assert hasattr(settings, "cognee")
            assert hasattr(settings, "milvus")
            assert hasattr(settings, "retrieval")
            assert hasattr(settings, "api")

    def test_sub_configs_have_defaults(self):
        """Sub-configurations should have default values."""
        from ai_insights.config.settings import Settings

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
            settings = Settings()

            # Cognee defaults
            assert settings.cognee.llm_provider == "custom"

            # Milvus defaults
            assert settings.milvus.mode == "lite"

            # Retrieval defaults
            assert settings.retrieval.top_k == 5

            # API defaults
            assert settings.api.port == 8001


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
