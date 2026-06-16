# JSON Token Analyzer

Visualizes token distribution inside a JSON payload using cl100k_base (GPT-4 / Claude compatible).

## Run

```
just up 1234
```

## Usage

Paste JSON into and press `Cmd+Enter`

Results show token counts and percentages in two modes:

- **by depth** — breakdown per nesting level
- **by key** — aggregated across the whole document, lists ignored, same key names merged
