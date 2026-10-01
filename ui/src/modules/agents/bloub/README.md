# bloub — vendored bot avatar engine

MIT-licensed code vendored from <https://github.com/jeremy-prt/bloub>
(SVG recreation of the x.ai bot avatar; one shape morphing through 14
states, measured off the reference video frame by frame).

Copied files (`bot/` + `gaze.ts`), unchanged except:

- `gaze.ts`: the three `@/` alias imports rewritten to relative `./bot/*`
  imports (this repo has no `@/bot` alias).
- All French comments kept as-is; the measured constants must not be
  "cleaned up" (see the project's README — rounding them breaks the
  resemblance).

The upstream React-free engine (`engine.sample(t)` is a pure function of
time) is wrapped for React by `../components/BloubBot.tsx`.

## Upstream license

MIT License

Copyright (c) 2026 Jérémy Perret

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Not affiliated with, endorsed by or connected to x.ai. The MIT licence covers
the upstream code, not the design it imitates.
