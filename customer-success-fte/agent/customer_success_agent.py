import os
import json
import logging
import httpx
from openai import AsyncOpenAI
from agent.prompts import CUSTOMER_SUCCESS_SYSTEM_PROMPT
from agent.tools import TOOLS, TOOL_SCHEMAS
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Providers configuration
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
GROQ_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

async def get_completion(messages: list, tools: list = None) -> any:
    """Robust completion with OpenRouter (primary) and GROQ (fallback)"""
    
    # 1. Try OpenRouter (Primary)
    if OPENROUTER_KEY and "your_openrouter" not in OPENROUTER_KEY:
        try:
            client = AsyncOpenAI(
                api_key=OPENROUTER_KEY,
                base_url="https://openrouter.ai/api/v1",
                default_headers={
                    "HTTP-Referer": "https://whoosh.ai",
                    "X-Title": "WHOOSH Customer Success Engine"
                }
            )
            response = await client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages,
                tools=tools,
                tool_choice="auto" if tools else None,
                max_tokens=1000,
                timeout=20.0
            )
            return response.choices[0]
        except Exception as e:
            logger.error(f"OpenRouter Error: {str(e)}")

    # 2. Try GROQ (Fallback)
    if GROQ_KEY and "your_groq" not in GROQ_KEY:
        try:
            client = AsyncOpenAI(
                api_key=GROQ_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
            response = await client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                tools=tools,
                tool_choice="auto" if tools else None,
                max_tokens=1000,
                timeout=15.0
            )
            return response.choices[0]
        except Exception as e:
            logger.error(f"GROQ fallback error: {str(e)}")

    raise Exception("All AI providers failed. No completion available.")

async def run_agent(messages: list, context: dict) -> dict:
    """
    Run the Customer Success FTE agent with tool-calling loop.
    Returns dict with output, tool_calls, and escalated flag.
    """
    system_message = {
        "role": "system",
        "content": CUSTOMER_SUCCESS_SYSTEM_PROMPT + f"\n\nContext: {json.dumps(context)}"
    }
    
    # Ensure messages format is correct (role/content)
    formatted_messages = []
    for m in messages:
        if isinstance(m, dict) and "role" in m and "content" in m:
            formatted_messages.append(m)
        else:
            # Handle potential raw string history
            formatted_messages.append({"role": "user", "content": str(m)})

    full_messages = [system_message] + formatted_messages
    tool_calls_made = []
    escalated = False
    final_output = ""

    for i in range(10):  # max 10 iterations
        try:
            choice = await get_completion(full_messages, tools=TOOL_SCHEMAS)
        except Exception as e:
            logger.critical(f"Agent stalled: {str(e)}")
            return {
                "output": "I apologize, but I'm experiencing internal telemetry disruptions. Connecting you to human support.",
                "tool_calls": tool_calls_made,
                "escalated": True
            }

        if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
            # Execute each tool call
            tool_results = []
            for tc in choice.message.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)
                logger.info(f"Iteration {i} - Tool call: {fn_name}({fn_args})")

                if fn_name in TOOLS:
                    try:
                        result = await TOOLS[fn_name](**fn_args)
                    except Exception as e:
                        result = f"Tool error: {str(e)}"
                        logger.error(f"Execution failed for {fn_name}: {e}")
                else:
                    result = f"Unknown tool: {fn_name}"

                tool_calls_made.append({"tool": fn_name, "args": fn_args, "result": result})
                
                if fn_name == "escalate_to_human":
                    escalated = True

                tool_results.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": str(result)
                })

            full_messages.append(choice.message)
            full_messages.extend(tool_results)

        else:
            # Agent finished
            final_output = choice.message.content or ""
            break

    return {
        "output": final_output,
        "tool_calls": tool_calls_made,
        "escalated": escalated
    }
