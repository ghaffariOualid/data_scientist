#!/usr/bin/env python3
"""Test OpenRouter API directly"""
import os
import dotenv
from langchain_openai import ChatOpenAI

# Load environment
dotenv.load_dotenv()

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
llm_model = os.getenv("LLM_MODEL", "mistralai/mistral-7b-instruct:free")

print(f"API Key: {openrouter_api_key[:20]}...")
print(f"Model: {llm_model}")

try:
    # Initialize LLM
    llm = ChatOpenAI(
        model=llm_model,
        api_key=openrouter_api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.0
    )
    
    # Test simple call
    response = llm.invoke("What is 2+2?")
    print(f"\n✅ Success! Response: {response.content}")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
