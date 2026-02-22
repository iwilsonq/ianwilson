---
title: "The Evolution of the AI-Driven Coder"
pubDate: "Feb 22 2026"
slug: the-evolution-of-the-ai-driven-coder
description: How AI agents transformed the way I write code, from skeptic to orchestrator
tags: ["ai", "webdev", "productivity"]
---

In the past year many of us developers have evolved from being skeptical of AI tools to fully embracing them and their benefits.

For much of 2025 I wrote code the old fashioned way; getting a ticket, thinking about its requirements and what parts of the codebase I'd need to make changes in.

In some tasks, I'd need to look extra hard to ensure my changes don't impact components and services on the other side of the repo. Sure, a statically-typed language would help guide me through a lot of big refactoring. And yes test coverage is also great to have, but I'd still need to go through and *do* the work.

I'd need to make the updates, run the tests, fix the tests, potentially add more tests, run the linters, fix the linter issues, write a nice commit message that is helpful to whoever looks at this code later, push, make a PR, oops we need to rebase on someone else's conflicting changes, push again forcefully, and then get someone to review it.

Now, if we take into account all of these process details, on top of our daily meeting schedule, we find this job to be taxing on our energy levels.

I would always find that I came to work on Monday, refreshed after a weekend of football and drinking, and put up some modest quality work. Then Tuesday a little less, Wednesday even less, and so on. Oh I need to interview somebody? Then I'm probably not going to be able to make those UX enhancements I was hoping to get to.

## The Stages of Letting Go

Steve Yegge talks about the stages of AI assisted coding in [one of his articles](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04). It starts with zero to little assistance, maybe you'd have ChatGPT running in your browser tab and you ask it about the Olympic hockey final while you do your work.

Then, you might have an agent running in your IDE, be it VSCode, Cursor, or Zed. Now the agent is co-located with your code. You gain the ability to tell it to look at certain files, highlight code snippets you want to make more concise.

Then, you find that, hey wait I can just have this robot generate entire modules. You drift from writing code to letting it write everything. Before, you were manually approving it to make updates to small chunks of code. Now, you're allowing the agent to make all changes and just looking at the diff.

The IDE becomes irrelevant. Why would you need a big editor running your myriad of LSPs, linters, and whatnot if you can just open up a terminal? The terminal agent thinks and scrolls by diffs, maybe you look at what it's doing, maybe not.

You start to think, "gee, this is pretty neat, what if I just throw this into a bunch of different tabs, each with their own agent going HAM on the codebase?" And then you do it. You might learn some growing pains along the way like how to handle multiple agents working on the same repository, but then you find out that you can use something like **git worktrees**.

What is a git worktree you ask? I barely understand it, but the agents do. Git is a pretty difficult interface for most humans, but the agents have been trained so much on it, they know exactly how to use it.

Then you might jump off the deep end — managing all of these agents is tiring. So you give the blank check to Anthropic and build an entire orchestrator to consume your tokens! We're cooking with gas now.

## Reclaiming Your Agency

Concepts that you never needed to learn because you were never working at break-neck velocity are suddenly learnable.

While the agents are cranking on your work, you can learn what a git worktree is. You can prepare your lunch (they cannot do this just yet). You can jam on the guitar or play video games. All the while creating more and quite possibly better code than it would take you all of Monday.

You can use this opportunity to think more intentionally about the product, tool, or creative work you're putting together. Before, you had to ideate on implementing a solution and whether it's even the right one. Now you can go down a much abbreviated rabbit hole and find out *quickly*. Save some of that time and energy and fail quickly. Find out what's wrong with the approach and go back to the drawing board.

Suddenly, the number of paths available to us are immediately abundant. That side project I'd spend a couple days on and then give up? I can iterate on it from a product perspective without even looking at the code. And I can learn a new framework like SvelteKit. I've never used Supabase or Resend or Posthog but sure lets try those as well.

We are enabled to be more ambitious and focus on the outcomes that we desire.

Then we can find out if it was really the thing we wanted in the first place.
