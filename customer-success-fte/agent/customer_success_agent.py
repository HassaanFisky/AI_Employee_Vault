import os
import json
import logging
from openai import AsyncOpenAI
from agent.prompts import CUSTOMER_SUCCESS_SYSTEM_PROMPT
from agent.tools import TOOLS, TOOL_SCHEMAS
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Groq via OpenAI-compatible client
client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
)

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

async def run_agent(messages: list, context: dict) -> dict:
    """
    Run the Customer Success FTE agent with tool-calling loop.
    Returns dict with output, tool_calls, and escalated flag.
    """
    system_message = {
        "role": "system",
        "content": CUSTOMER_SUCCESS_SYSTEM_PROMPT + f"\n\nContext: {json.dumps(context)}"
    }
    full_messages = [system_message] + messages
    tool_calls_made = []
    escalated = False
    final_output = ""

    for _ in range(10):  # max 10 iterations
        response = await client.chat.completions.create(
            model=MODEL,
            messages=full_messages,
            tools=TOOL_SCHEMAS,
            tool_choice="auto",
            max_tokens=1000
        )

        choice = response.choices[0]

        if choice.finish_reason == "tool_calls":
            # Execute each tool call
            tool_results = []
            for tc in choice.message.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)
                logger.info(f"Tool call: {fn_name}({fn_args})")

                if fn_name in TOOLS:
                    try:
                        result = await TOOLS[fn_name](**fn_args)
                    except Exception as e:
                        result = f"Tool error: {str(e)}"
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
