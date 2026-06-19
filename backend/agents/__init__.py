from ..base_agent import GenericAgent
from .marketing import MarketingAgent
from .reviews import ReviewAgent
from .revenue import RevenueAgent
from .reservation import ReservationAgent
from .analytics_agents import (
    MenuEngineeringAgent, InventoryAgent, FinanceAgent,
    CRMAgent, ForecastAgent, LabourAgent,
)
from .intelligence_agents import CompetitorAgent, TrendAgent, CampaignAgent

HANDLERS = {
    "GenericAgent": GenericAgent,
    "MarketingAgent": MarketingAgent,
    "ReviewAgent": ReviewAgent,
    "RevenueAgent": RevenueAgent,
    "ReservationAgent": ReservationAgent,
    "MenuEngineeringAgent": MenuEngineeringAgent,
    "InventoryAgent": InventoryAgent,
    "FinanceAgent": FinanceAgent,
    "CRMAgent": CRMAgent,
    "ForecastAgent": ForecastAgent,
    "LabourAgent": LabourAgent,
    "CompetitorAgent": CompetitorAgent,
    "TrendAgent": TrendAgent,
    "CampaignAgent": CampaignAgent,
}
