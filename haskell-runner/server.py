import http.server
import json
import subprocess
import tempfile
import os
import re

# Matches an actual main definition: "main" at the start of a line (not in comments)
_MAIN_DEF = re.compile(r"^main\s*(::|\s*=)", re.MULTILINE)

NO_MAIN_MSG = (
    "No main function found.\n"
    "Use the GHCi terminal below to evaluate expressions, e.g.:\n"
    "  tst1\n  tst2\n  :t myFunction"
)


def write_code_file(code: str) -> str:
    """Write Haskell code to a temp file, injecting a no-op main if absent."""
    if not _MAIN_DEF.search(code):
        code += "\n\nmain :: IO ()\nmain = return ()"
    with tempfile.NamedTemporaryFile(suffix=".hs", delete=False, mode="w") as f:
        f.write(code)
        return f.name


def clean_ghci_output(raw: str) -> str:
    """Strip GHCi loading/module lines, leaving only expression output."""
    result = []
    for line in raw.splitlines():
        s = line.strip()
        # Skip GHCi module-loading noise (very specific patterns)
        if (
            ("Compiling" in s and s.startswith("["))  # [1 of 1] Compiling Main ...
            or s.startswith("Ok,")                    # Ok, one module loaded.
            or s.startswith("Failed,")                # Failed, modules loaded.
            or s == "Leaving GHCi."
            or s.startswith("Loaded GHCi")
            or s.startswith("GHCi,")
        ):
            continue
        result.append(line)
    return "\n".join(result).strip()


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress request logging

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))

        if self.path == "/ghci":
            response = self._handle_ghci(body)
        else:
            response = self._handle_execute(body)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def _handle_execute(self, body: dict) -> dict:
        code = body.get("code", "")
        has_main = bool(_MAIN_DEF.search(code))
        fname = write_code_file(code)
        try:
            result = subprocess.run(
                ["runghc", fname],
                capture_output=True,
                text=True,
                timeout=15,
            )
            # If code had no real main and ran clean, show a hint instead of empty output
            stdout = result.stdout
            if not has_main and result.returncode == 0 and not stdout.strip():
                stdout = NO_MAIN_MSG
            return {
                "stdout": stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": "Execution timed out (15s limit)", "exit_code": 1}
        except Exception as e:
            return {"stdout": "", "stderr": str(e), "exit_code": 1}
        finally:
            try:
                os.unlink(fname)
            except OSError:
                pass

    def _handle_ghci(self, body: dict) -> dict:
        code = body.get("code", "")
        expr = body.get("expr", "").strip()
        fname = write_code_file(code)
        try:
            # Feed GHCi a script: suppress prompts, load file, eval expr, quit
            ghci_input = (
                ':set prompt ""\n'
                ':set prompt-cont ""\n'
                f":load {fname}\n"
                f"{expr}\n"
                ":quit\n"
            )
            result = subprocess.run(
                ["ghci", "-v0", "-ignore-dot-ghci"],
                input=ghci_input,
                capture_output=True,
                text=True,
                timeout=15,
            )
            output = clean_ghci_output(result.stdout)
            stderr = result.stderr.strip()
            return {
                "output": output,
                "stderr": stderr,
                "exit_code": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "stderr": "Timed out (15s limit)", "exit_code": 1}
        except Exception as e:
            return {"output": "", "stderr": str(e), "exit_code": 1}
        finally:
            try:
                os.unlink(fname)
            except OSError:
                pass


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", 8080), Handler)
    print("Haskell runner listening on :8080")
    server.serve_forever()
