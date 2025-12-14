#!/usr/bin/env python3
"""Test CrewAI with OpenRouter"""
import os
import sys

# Apply signal patch for Windows compatibility BEFORE importing crewai
import signal_patch

import dotenv
from crewai import Agent, Task, Crew, Process
from crewai.llm import LLM

# Load environment
sys.path.insert(0, os.path.dirname(__file__))
dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
llm_model = os.getenv("LLM_MODEL", "mistralai/mistral-7b-instruct:free")

print(f"API Key: {openrouter_api_key[:20]}...")
print(f"Model: {llm_model}\n")

try:
    # Initialize LLM with CrewAI
    llm = LLM(
        model=llm_model,
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_api_key,
        temperature=0.0
    )
    
    print("✅ LLM initialized successfully\n")
    
    # Create simple agent
    agent = Agent(
        role="Simple Tester",
        goal="Test if the LLM works",
        backstory="You are a simple test agent",
        llm=llm,
        verbose=True
    )
    
    print("✅ Agent created successfully\n")
    
    # Create simple task
    task = Task(
        description="Say hello and confirm the LLM is working",
        expected_output="A simple greeting confirming the LLM works",
        agent=agent
    )
    
    print("✅ Task created successfully\n")
    
    # Create crew
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )
    
    print("✅ Crew created successfully\n")
    print("Starting crew execution...\n")
    
    # Execute
    result = crew.kickoff()
    
    print(f"\n✅ Success! Result:\n{result}")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
