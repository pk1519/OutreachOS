from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger("duo_systems.messaging")

class MessagingProvider(ABC):
    """
    Abstract Messaging Provider for Duo Systems Outreach Center.
    Enables pluggable communication channels (Email, future WhatsApp, SMS)
    without restructuring the application.
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the identifier of this messaging provider."""
        pass

    @abstractmethod
    def validate_connection(self, db: Any) -> Dict[str, Any]:
        """Validates if the provider has active, valid credentials."""
        pass

    @abstractmethod
    def send_message(
        self,
        recipient: str,
        subject: str,
        body: str,
        db: Any,
        **kwargs
    ) -> Dict[str, Any]:
        """Sends an outreach message to a recipient."""
        pass


class WhatsAppProvider(MessagingProvider):
    """
    Future WhatsApp Business API / BSP Provider.
    Reserved for upcoming release.
    """
    def get_provider_name(self) -> str:
        return "whatsapp"

    def validate_connection(self, db: Any) -> Dict[str, Any]:
        return {
            "provider": "whatsapp",
            "is_connected": False,
            "status": "NOT_CONFIGURED",
            "message": "WhatsApp Business integration is reserved for future release."
        }

    def send_message(
        self,
        recipient: str,
        subject: str,
        body: str,
        db: Any,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            "WhatsApp messaging is not implemented in this version. "
            "Please use the official Gmail API EmailProvider."
        )
