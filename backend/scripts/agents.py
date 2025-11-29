import os
from crewai import Agent
import dotenv
from scripts.custom_tools import list_tables_tool, tables_schema_tool, execute_sql_tool, check_sql_tool
from scripts.custom_groq_llm import CustomGroqLLM

# Load .env file from the parent directory (project root)
dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
# Load the Groq API key from environment variables
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY must be set in the environment variables or .env file")

class CustomAgents:
    def __init__(self):
        # Utiliser notre classe LLM personnalisée pour Groq
        self.llm = CustomGroqLLM(
            model="llama-3.3-70b-versatile",  # Utiliser un modèle plus léger pour de meilleures performances
            temperature=0.0,
            api_key=groq_api_key
        )

    def sql_developer(self):
        return Agent(
            role="SQL Developer",
            goal="Construct and execute SQL queries based on user requests",
            backstory=(
                """
                You are an experienced database engineer skilled at creating efficient and complex SQL queries.
                You deeply understand databases and optimization strategies.
                from user {query} identify which columns they are referring to from the database and execute queries according to user requirement to fetch data.
                Only use the provided tools when its needed, dont make your own tools.
                """
            ),
            llm=self.llm,
            tools=[list_tables_tool, tables_schema_tool, execute_sql_tool, check_sql_tool],
            allow_delegation=False,
            verbose=True,
        )

    def data_analyst(self):
        return Agent(
            role="Senior Data Analyst",
            goal="Analyze the data from the SQL developer and provide meaningful insights, explain the insights",
            backstory="You analyze datasets using Python and produce clear, concise insights.",
            llm=self.llm,
            allow_delegation=False,
            verbose=True,
        )

    def report_writer(self):
        return Agent(
            role="Report Writer",
            goal="Summarize the analysis into a short, executive-level report,include the analysed numbers to explain the insights",
            backstory="You create concise reports highlighting the most important findings.",
            llm=self.llm,
            allow_delegation=False,
            verbose=True,
        )

    def data_visualization_agent(self):
        return Agent(
            role="Data Visualization Agent",
            goal="""
                Generate Python code using Plotly to visualize data based on user queries.
                Your code must be wrapped in triple backticks: ```python ... ``` and produce a 'fig' object.
                """,
            backstory="""
                You are an expert data scientist. You have a local CSV file (already prepared).
                Use Plotly to create a figure (e.g. fig = px.bar(...)).
                Do not show or save the figure. Just produce the code snippet in triple backticks.""",
            llm=self.llm,
            allow_delegation=False,
            verbose=True,
        )

