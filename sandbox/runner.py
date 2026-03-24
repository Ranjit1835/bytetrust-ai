import sys
import json
import signal
import traceback
import io
from contextlib import redirect_stdout


def timeout_handler(signum, frame):
    raise TimeoutError("Execution exceeded 5 seconds")


def safe_exec(code_str, test_input):
    """
    Safely execute Python code with input and return output.
    - Uses restricted globals (no os, sys, subprocess access)
    - Captures stdout
    - Returns result or error message
    """
    safe_builtins = {
        'print': print,
        'range': range,
        'len': len,
        'list': list,
        'dict': dict,
        'set': set,
        'tuple': tuple,
        'str': str,
        'int': int,
        'float': float,
        'bool': bool,
        'abs': abs,
        'max': max,
        'min': min,
        'sum': sum,
        'sorted': sorted,
        'enumerate': enumerate,
        'zip': zip,
        'map': map,
        'filter': filter,
        'isinstance': isinstance,
        'type': type,
        'round': round,
        'input': None,
        'True': True,
        'False': False,
        'None': None,
    }

    # Set timeout (Unix only)
    try:
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(5)
    except (AttributeError, ValueError):
        pass  # Windows doesn't support SIGALRM

    f = io.StringIO()
    try:
        exec_globals = {'__builtins__': safe_builtins}
        with redirect_stdout(f):
            exec(code_str, exec_globals)
            exec(test_input, exec_globals)
        output = f.getvalue().strip()
        return {"success": True, "output": output, "error": None}
    except TimeoutError:
        return {"success": False, "output": None, "error": "Execution timed out (>5s)"}
    except Exception as e:
        return {"success": False, "output": None, "error": str(e)}
    finally:
        try:
            signal.alarm(0)
        except (AttributeError, ValueError):
            pass


if __name__ == "__main__":
    payload = json.loads(sys.stdin.read())
    result = safe_exec(payload["code"], payload["test_input"])
    print(json.dumps(result))
