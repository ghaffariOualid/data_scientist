from crewai import Task
from textwrap import dedent


class CustomTasks:
    def extract_data(self, agent):
        return Task(
            description=dedent("""
                User Query: {query}

                TASK OBJECTIVE:
                Extract relevant data from the database that directly addresses the user's query.

                REQUIRED STEPS:
                1. Analyze the user query to understand the specific data requirements
                2. Use list_tables_tool to identify available tables
                3. Use tables_schema_tool to understand table structures and column details
                4. Construct an appropriate SQL query that retrieves exactly the needed data
                5. Use check_sql_tool to validate the query syntax and logic
                6. Execute the query using execute_sql_tool
                7. Verify the results are relevant and complete

                QUALITY STANDARDS:
                - Query should be efficient and not retrieve unnecessary data
                - Results should be structured for easy analysis
                - Handle potential NULL values appropriately
                - Ensure data types are preserved correctly
                - Return data in a format suitable for subsequent analysis

                OUTPUT FORMAT:
                Provide the SQL query used and the resulting dataset with clear column headers.
                """),
            expected_output="SQL query executed successfully with structured data results including column names and data types.",
            agent=agent,
        )

    def analyze_data(self, agent, extract_task):
        return Task(
            description=dedent("""
                User Query: {query}

                TASK OBJECTIVE:
                Perform comprehensive data analysis on the extracted dataset to provide meaningful insights that directly answer the user's query.

                ANALYSIS FRAMEWORK:
                1. Data Overview: Summarize the dataset structure, size, and key characteristics
                2. Data Quality Check: Assess completeness, identify missing values, outliers, and data types
                3. Statistical Summary: Calculate relevant descriptive statistics (mean, median, mode, std dev, etc.)
                4. Pattern Recognition: Identify trends, correlations, and significant patterns
                5. Query-Specific Analysis: Address the specific aspects mentioned in the user query
                6. Comparative Analysis: Compare different groups or time periods if applicable
                7. Key Insights: Extract the most important findings with business/technical implications
                8. Validation: Ensure insights are statistically sound and logically consistent

                OUTPUT REQUIREMENTS:
                - Structure analysis in clear sections with descriptive headers
                - Include specific numbers, percentages, and statistical measures
                - Explain the significance and implications of findings
                - Use professional, objective language
                - Highlight any limitations or assumptions in the analysis
                - Provide context for why certain insights are important

                QUALITY ASSURANCE:
                - Ensure all claims are supported by the data
                - Use appropriate statistical methods for the data types
                - Consider potential confounding factors
                - Validate calculations and logic
                """),
            expected_output="Comprehensive data analysis report with statistical insights, key findings, and clear explanations addressing the user's query.",
            agent=agent,
            context=[extract_task],
        )

    def write_report(self, agent, analyze_task):
        return Task(
            description=dedent("""
                User Query: {query}

                TASK OBJECTIVE:
                Create a concise, executive-level report that synthesizes the data analysis into actionable business insights.

                REPORT STRUCTURE:
                ## Executive Summary
                - 2-3 sentence overview of the most critical findings
                - Answer the user's query directly
                - Highlight business impact

                ## Key Findings
                - Top 3-5 most important insights with specific metrics
                - Include percentages, trends, and comparative data
                - Explain what the numbers mean in practical terms

                ## Analysis Overview
                - Brief description of methodology and data scope
                - Key statistical measures and their significance
                - Any important limitations or assumptions

                ## Recommendations
                - Prioritized action items based on the findings
                - Specific, measurable suggestions
                - Timeline considerations where relevant

                ## Next Steps
                - Suggested follow-up analyses or data collection
                - Additional questions that could provide more insights

                WRITING GUIDELINES:
                - Use clear, professional business language
                - Include specific numbers to support claims
                - Focus on actionable insights over raw data
                - Explain technical findings in business terms
                - Keep the report concise but comprehensive
                - Use markdown formatting for readability
                """),
            expected_output="Professional executive report in markdown format with clear sections, specific metrics, and actionable recommendations.",
            agent=agent,
            context=[analyze_task],
        )

    def generate_visualization(self, agent, viz_prompt, df):
        return Task(
            description=dedent(f"""
                DATA CONTEXT:
                Dataset has {len(df)} rows with columns: {', '.join(df.columns)}
                Data types: {df.dtypes.to_dict()}
                Sample data (first 5 rows):
                {df.head(5).to_csv(index=False)}

                VISUALIZATION REQUEST: "{viz_prompt}"

                TASK REQUIREMENTS:
                1. Analyze the data structure and identify the most appropriate visualization type
                2. Determine which columns should be used for the visualization
                3. Select appropriate Plotly chart type (bar, line, scatter, pie, histogram, etc.)
                4. Consider data types and ensure proper mapping (categorical vs numerical)
                5. Include meaningful titles, axis labels, and legends
                6. Use appropriate color schemes for clarity and accessibility
                7. Add interactivity where it enhances understanding

                VISUALIZATION BEST PRACTICES:
                - Choose chart type that best represents the data and insight
                - Ensure the visualization directly addresses the user's request
                - Use clear, descriptive titles and labels
                - Consider data distribution and potential outliers
                - Make the visualization self-explanatory
                - Optimize for web display and readability

                TECHNICAL SPECIFICATIONS:
                - Use Plotly Express (px) for standard charts, Graph Objects (go) for complex ones
                - The dataframe variable is named 'df'
                - Final output must be a 'fig' object
                - Code must be executable and produce a valid Plotly figure
                - Handle missing data appropriately

                OUTPUT FORMAT:
                Provide complete, executable Python code wrapped in triple backticks.
                DO NOT include import statements - plotly.express (as px), pandas (as pd), and plotly.graph_objects (as go) are already available.
                The dataframe is available as 'df'.
                ```python
                # Your visualization code here - no imports needed
                fig = px.bar(df, x='column', y='value', title='Title')
                ```
                """),
            expected_output="Complete, executable Plotly code in triple backticks that creates an insightful 'fig' object addressing the visualization request.",
            agent=agent,
        )

    def fallback_analysis(self, agent):
        """Fallback analysis task when main analysis fails."""
        return Task(
            description=dedent("""
                The main analysis failed. Provide a simple, reliable summary of the data.

                TASK: Create a basic analysis report with:
                1. Total number of records
                2. Key column summaries (counts, basic stats for numeric columns)
                3. Simple observations about the data
                4. Any obvious patterns or trends

                Keep it simple and factual. Avoid complex statistical analysis.
                """),
            expected_output="Basic data summary with counts, simple statistics, and clear observations.",
            agent=agent,
        )
