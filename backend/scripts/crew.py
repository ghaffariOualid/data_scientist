import logging
from typing import Optional, Dict, Any
from crewai import Crew, Process
from scripts.agents import CustomAgents
from scripts.tasks import CustomTasks

logger = logging.getLogger(__name__)

class CustomCrew:
    def __init__(self, query: str, df=None, visualization: bool = False):
        self.query = query
        self.df = df
        self.visualization = visualization
        self.max_retries = 2  # Maximum number of retries for failed operations

    def run(self):
        """
        Execute the crew with error handling and recovery mechanisms.

        Returns:
            Crew output or fallback result
        """
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                logger.info(f"Starting crew execution (attempt {attempt + 1}/{self.max_retries + 1})")

                result = self._execute_crew()

                # Validate result
                if self._validate_result(result):
                    logger.info("Crew execution completed successfully")
                    return result
                else:
                    logger.warning(f"Result validation failed on attempt {attempt + 1}")
                    last_error = "Result validation failed"
                    continue

            except Exception as e:
                last_error = str(e)
                logger.error(f"Crew execution failed on attempt {attempt + 1}: {last_error}", exc_info=True)

                if attempt < self.max_retries:
                    logger.info(f"Retrying crew execution in {attempt + 1} seconds...")
                    import time
                    time.sleep(attempt + 1)  # Progressive backoff
                else:
                    logger.error("All crew execution attempts failed")

        # Return fallback result if all attempts failed
        return self._create_fallback_result(last_error)

    def _execute_crew(self):
        """Execute the actual crew logic."""
        agents = CustomAgents()
        tasks = CustomTasks()

        if self.visualization:
            return self._execute_visualization_crew(agents, tasks)
        else:
            return self._execute_analysis_crew(agents, tasks)

    def _execute_visualization_crew(self, agents: CustomAgents, tasks: CustomTasks):
        """Execute visualization-specific crew."""
        try:
            viz_agent = agents.data_visualization_agent()
            viz_task = tasks.generate_visualization(viz_agent, self.query, self.df)

            crew = Crew(
                agents=[viz_agent],
                tasks=[viz_task],
                process=Process.sequential,
                verbose=True,
            )

            result = crew.kickoff()
            logger.info("Visualization crew executed successfully")
            return result

        except Exception as e:
            logger.error(f"Visualization crew execution error: {str(e)}")
            raise

    def _execute_analysis_crew(self, agents: CustomAgents, tasks: CustomTasks):
        """Execute analysis-specific crew with sequential task execution."""
        try:
            sql_dev = agents.sql_developer()
            data_analyst = agents.data_analyst()
            report_writer = agents.report_writer()

            extract_task = tasks.extract_data(sql_dev)
            analyze_task = tasks.analyze_data(data_analyst, extract_task)
            write_task = tasks.write_report(report_writer, analyze_task)

            crew = Crew(
                agents=[sql_dev, data_analyst, report_writer],
                tasks=[extract_task, analyze_task, write_task],
                process=Process.sequential,
                verbose=True,
            )

            result = crew.kickoff(inputs={"query": self.query})
            logger.info("Analysis crew executed successfully")
            return result

        except Exception as e:
            logger.error(f"Analysis crew execution error: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise

    def _validate_result(self, result) -> bool:
        """
        Validate the crew execution result.

        Args:
            result: The crew execution result

        Returns:
            True if result is valid, False otherwise
        """
        if not result:
            logger.warning("Result is None or empty")
            return False

        # Check if result has raw content
        if hasattr(result, 'raw') and result.raw:
            content = result.raw.strip()
            if len(content) < 10:  # Minimum meaningful content length
                logger.warning("Result content too short")
                return False
            return True

        # Check if result is a string
        if isinstance(result, str):
            content = result.strip()
            if len(content) < 10:
                logger.warning("String result too short")
                return False
            return True

        logger.warning(f"Unexpected result type: {type(result)}")
        return False

    def _create_fallback_result(self, error: str):
        """
        Create a fallback result when all execution attempts fail.
        Attempts a simple fallback analysis if possible.

        Args:
            error: The error message from the last failure

        Returns:
            A fallback result object
        """
        try:
            logger.info("Attempting fallback analysis...")

            # Try fallback analysis with simpler agent
            agents = CustomAgents()
            tasks = CustomTasks()

            fallback_agent = agents.fallback_analyst()
            fallback_task = tasks.fallback_analysis(fallback_agent)

            crew = Crew(
                agents=[fallback_agent],
                tasks=[fallback_task],
                process=Process.sequential,
                verbose=True,
            )

            result = crew.kickoff()
            if result and result.raw:
                fallback_content = f"""
# Fallback Analysis

The primary analysis encountered issues, but here's a basic analysis of your data:

{result.raw}

## Note:
This is a simplified analysis due to processing constraints. For more detailed insights, please try rephrasing your query or check your data format.
"""
                logger.info("Fallback analysis succeeded")
            else:
                raise Exception("Fallback analysis returned empty result")

        except Exception as fallback_error:
            logger.warning(f"Fallback analysis also failed: {str(fallback_error)}")

            fallback_content = f"""
# Analysis Unavailable

We encountered an error while processing your request: {error}

## Possible Solutions:
- Please check your query for clarity and completeness
- Ensure your data is properly formatted
- Try rephrasing your question
- Contact support if the issue persists

## What We Tried:
- Validated your input query
- Attempted multiple processing strategies
- Applied error recovery mechanisms
- Tried fallback analysis (also failed)

If this problem continues, please provide more details about your data and query requirements.
"""

        # Create a simple object with raw attribute for compatibility
        class FallbackResult:
            def __init__(self, content: str):
                self.raw = content

        logger.warning(f"Returning fallback result due to persistent errors: {error}")
        return FallbackResult(fallback_content)
