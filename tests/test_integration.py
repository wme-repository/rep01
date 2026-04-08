import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def build_test_env() -> dict[str, str]:
    env = os.environ.copy()
    pythonpath = str(SRC)
    if env.get("PYTHONPATH"):
        pythonpath = f"{pythonpath}{os.pathsep}{env['PYTHONPATH']}"
    env["PYTHONPATH"] = pythonpath
    env["PYTHONUNBUFFERED"] = "1"
    env["META_ACCESS_TOKEN"] = "dummy-token"
    return env


def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


class TransportIntegrationTest(unittest.TestCase):
    def test_streamable_http_starts_and_accepts_requests(self) -> None:
        port = get_free_port()
        env = build_test_env()
        process = subprocess.Popen(
            [
                sys.executable,
                "-u",
                "-m",
                "meta_ads_mcp_readonly",
                "--transport",
                "streamable-http",
                "--host",
                "127.0.0.1",
                "--port",
                str(port),
            ],
            cwd=ROOT,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            deadline = time.time() + 10
            last_error: Exception | None = None
            while time.time() < deadline:
                if process.poll() is not None:
                    break
                try:
                    with urllib.request.urlopen(
                        f"http://127.0.0.1:{port}/", timeout=2
                    ) as response:
                        status = response.getcode()
                    self.assertIn(status, {200, 404, 405})
                    break
                except urllib.error.HTTPError as exc:
                    try:
                        self.assertIn(exc.code, {404, 405})
                        break
                    finally:
                        exc.close()
                except Exception as exc:  # pragma: no cover - timing dependent
                    last_error = exc
                    time.sleep(0.25)
            else:
                self.fail(f"HTTP transport did not become reachable: {last_error!r}")

            self.assertIsNone(process.poll(), "HTTP transport exited unexpectedly")
        finally:
            process.terminate()
            try:
                stdout, stderr = process.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                stdout, stderr = process.communicate(timeout=10)

        self.assertIn("server_http_ready", stderr)
        self.assertTrue("Uvicorn running on" in stderr or "Application startup complete." in stderr)

    def test_stdio_starts_and_waits_for_client(self) -> None:
        env = build_test_env()
        process = subprocess.Popen(
            [
                sys.executable,
                "-u",
                "-m",
                "meta_ads_mcp_readonly",
                "--transport",
                "stdio",
            ],
            cwd=ROOT,
            env=env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            time.sleep(2)
            self.assertIsNone(process.poll(), "stdio transport exited before a client connected")
        finally:
            process.terminate()
            try:
                stdout, stderr = process.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                stdout, stderr = process.communicate(timeout=10)

        self.assertIn("server_start", stderr)
