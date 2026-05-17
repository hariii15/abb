import pandas as pd
import numpy as np
from shared.logging.logger import get_logger
from datetime import datetime, timedelta

logger = get_logger(__name__)

class ForecastingEngine:
    def __init__(self):
        pass

    def predict_future_usage(self, history_df: pd.DataFrame, periods=6, freq='H'):
        """
        Uses stable linear regression (numpy.polyfit) to predict future resource usage.
        history_df must have columns: ['ds', 'y'] where 'y' is the metric value.
        """
        if len(history_df) < 2:
            return None

        try:
            # Simple, stable linear fallback (no Prophet)
            x = np.arange(len(history_df))
            y = history_df['y'].values
            
            # Fit a 1st degree polynomial (linear line)
            slope, intercept = np.polyfit(x, y, 1)
            
            # Predict the value after 'periods' into the future
            future_x = len(x) + periods
            predicted = (slope * future_x) + intercept
            
            # Ensure we don't predict negative values for metrics
            predicted = max(0.0, float(predicted))
            
            # Calculate bounds based on historical variance
            variance = np.var(y) if len(y) > 1 else 0.1
            margin = np.sqrt(variance) * 1.5 # 1.5 standard deviations
            
            timestamp = history_df['ds'].iloc[-1] + timedelta(hours=periods)
            
            return {
                "predicted_value": round(predicted, 2),
                "upper_bound": round(predicted + margin, 2),
                "lower_bound": round(max(0.0, predicted - margin), 2),
                "trend": "increasing" if slope > 0.01 else ("decreasing" if slope < -0.01 else "stable"),
                "timestamp": timestamp.isoformat()
            }
        except Exception as e:
            logger.error(f"Linear forecasting failed: {e}")
            return None

    def estimate_time_to_exhaustion(self, history_df: pd.DataFrame, limit: float):
        """
        Calculates when a resource (e.g. Memory) will hit a specific limit.
        """
        prediction = self.predict_future_usage(history_df, periods=24, freq='H')
        if not prediction:
            return "Stable"

        if prediction['predicted_value'] >= limit:
            return "Under 24 hours"
        
        return "Safe"
