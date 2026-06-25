import os

MARKDOWN_FILE = "/tmp/zootoolz_markdown.md"


def load() -> str:
    try:
        with open(MARKDOWN_FILE) as f:
            return f.read()
    except FileNotFoundError:
        return ""


def save(content: str) -> None:
    with open(MARKDOWN_FILE, "w") as f:
        f.write(content)
