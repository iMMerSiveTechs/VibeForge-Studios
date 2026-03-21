# Model Routing Policy

## 1. Default model routing

- **Claude Opus 4.6**
  - strategy
  - architecture
  - repo analysis
  - high-stakes implementation
  - reviews and tradeoff analysis

- **Claude Sonnet 4.6**
  - smaller, bounded, faster work
  - focused implementation passes
  - cleanup and narrow debugging

- **openai-codex/gpt-5.4**
  - routine execution
  - shell-heavy/local workflow tasks
  - concise edits and fast iterations

- **Gemini**
  - use only when its feature set or behavior is clearly the better fit
  - currently available through provider access, not a standalone local CLI

## 2. Tool policy

- Use the best direct tool when one exists.
- Use all available tools and connections when they reduce friction or improve control.
- Prefer first-class tools over invented workflows.
- Do not install extra tooling just because it sounds useful; require a real use case.

## 3. Recommendation style

When proposing a better path, include:
- current path
- better path
- diff
- why
- cost / risk / control impact

## 4. Decision bias

- reality over vibes
- ROI before novelty
- smallest robust move first
- avoid broad rewrites unless justified

## 5. Visibility rule

When model choice materially affects cost, speed, quality, or risk, state:
- selected model/provider
- why it was chosen
- why the alternatives were not chosen
