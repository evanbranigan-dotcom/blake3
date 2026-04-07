"""
SHA-256 Deep Dive: What actually happens when your iPhone hashes 1 MB.

Act 1: Zoom into one block — 8 registers churning through 64 rounds
Act 2: Zoom out — that block's output feeds the next (Merkle-Damgård chain)
Act 3: Keep zooming — reveal the full 16,384-block queue, all waiting in line
Act 4: Contrast with BLAKE3 — 1,024 chunks at once, 10-level tree merge
"""

from manim import *
import numpy as np
import random

# ── Design system ──
BG = "#0a0a0f"
SURFACE = "#0d0d14"
CELL_BG = "#111118"
BORDER = "#1e1e28"
BORDER_LIGHT = "#2a2a36"
TEXT_BRIGHT = "#e0e0e8"
TEXT = "#c8c8d0"
TEXT_DIM = "#666666"
TEXT_MUTED = "#444444"
SHA_COLOR = "#f59e0b"
SHA_DIM = ManimColor.from_hex("#f59e0b").interpolate(ManimColor.from_hex(BG), 0.85)
BLAKE_COLOR = "#7c3aed"
BLAKE_BRIGHT = "#a78bfa"
GREEN = "#22c55e"

# Real SHA-256 initial hash values
H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]

REG_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"]


def rand_hex():
    return f"{random.randint(0, 0xFFFFFFFF):08x}"


class SHA256DeepDive(Scene):
    def construct(self):
        self.camera.background_color = BG
        random.seed(42)

        self.act1_one_block()
        self.act2_chain()
        self.act3_full_scale()
        self.act4_blake3_contrast()

    # ══════════════════════════════════════════════
    # ACT 1: Inside one block — 64 rounds of compression
    # ══════════════════════════════════════════════
    def act1_one_block(self):
        # Title
        title = Text("SHA-256: Inside One Block", color=SHA_COLOR, font_size=30, weight=BOLD)
        subtitle = Text("64 bytes of data → 64 rounds of compression", color=TEXT_DIM, font_size=18)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(title), FadeIn(subtitle), run_time=0.6)
        self.wait(0.5)
        self.play(FadeOut(title), FadeOut(subtitle), run_time=0.4)

        # ── 8 registers ──
        reg_label = Text("8 working registers", color=TEXT_DIM, font_size=14)
        reg_label.to_edge(UP, buff=0.4)
        self.play(FadeIn(reg_label), run_time=0.3)

        registers = VGroup()
        reg_values = VGroup()
        reg_labels = VGroup()

        for i in range(8):
            # Register box
            box = RoundedRectangle(
                corner_radius=0.08, width=1.4, height=0.55,
                fill_color=CELL_BG, fill_opacity=1,
                stroke_color=BORDER_LIGHT, stroke_width=1,
            )
            # Name label
            name = Text(REG_NAMES[i], color=SHA_COLOR, font_size=14, weight=BOLD)
            name.next_to(box, UP, buff=0.08)
            # Hex value
            val = Text(f"{H0[i]:08x}", color=TEXT, font_size=13, font="SF Mono")
            val.move_to(box)

            registers.add(box)
            reg_values.add(val)
            reg_labels.add(name)

        all_regs = VGroup()
        for i in range(8):
            all_regs.add(VGroup(registers[i], reg_values[i], reg_labels[i]))

        all_regs.arrange(RIGHT, buff=0.25)
        all_regs.move_to(UP * 1.8)

        self.play(
            *[FadeIn(r, shift=DOWN * 0.2) for r in all_regs],
            run_time=0.5,
            lag_ratio=0.05,
        )

        # ── Round counter ──
        round_text = Text("Round 0 / 64", color=SHA_COLOR, font_size=20)
        round_text.move_to(UP * 0.6)
        self.add(round_text)

        # ── Operation annotations ──
        op_box = RoundedRectangle(
            corner_radius=0.1, width=10, height=1.6,
            fill_color=SURFACE, fill_opacity=0.8,
            stroke_color=BORDER, stroke_width=1,
        )
        op_box.move_to(DOWN * 1.0)
        self.add(op_box)

        op_line1 = Text("T1 = h + Σ1(e) + Ch(e,f,g) + K[i] + W[i]", color=TEXT, font_size=15, font="SF Mono")
        op_line2 = Text("T2 = Σ0(a) + Maj(a,b,c)", color=TEXT, font_size=15, font="SF Mono")
        op_line3 = Text("shift registers → a = T1+T2, e = d+T1", color=TEXT_DIM, font_size=14, font="SF Mono")
        ops = VGroup(op_line1, op_line2, op_line3).arrange(DOWN, buff=0.12)
        ops.move_to(op_box)
        self.add(ops)

        # ── Round progress strip ──
        strip_bg = Rectangle(
            width=10, height=0.2,
            fill_color=CELL_BG, fill_opacity=1,
            stroke_color=BORDER, stroke_width=0.5,
        )
        strip_bg.move_to(DOWN * 2.5)
        self.add(strip_bg)

        strip_label = Text("rounds", color=TEXT_MUTED, font_size=11)
        strip_label.next_to(strip_bg, LEFT, buff=0.15)
        self.add(strip_label)

        filled_blocks = VGroup()

        # ── Animate 64 rounds ──
        # Show first 8 rounds slowly, then accelerate
        for r in range(64):
            # Determine speed
            if r < 8:
                dur = 0.15
            elif r < 20:
                dur = 0.08
            else:
                dur = 0.03

            anims = []

            # Update round counter
            new_round = Text(f"Round {r+1} / 64", color=SHA_COLOR, font_size=20)
            new_round.move_to(round_text)
            anims.append(Transform(round_text, new_round))

            # Simulate register shift — new random values cascade down
            # Highlight registers that change (a and e are the "hot" ones)
            new_vals = []
            for i in range(8):
                new_val_text = Text(rand_hex(), color=TEXT, font_size=13, font="SF Mono")
                new_val_text.move_to(reg_values[i])
                new_vals.append(new_val_text)
                anims.append(Transform(reg_values[i], new_val_text))

            # Flash register a and e borders (the ones that get computed)
            if r < 20:
                anims.append(
                    registers[0].animate.set_stroke(SHA_COLOR, width=2, opacity=0.8)
                )
                anims.append(
                    registers[4].animate.set_stroke(SHA_COLOR, width=2, opacity=0.8)
                )

            # Fill progress strip
            block = Rectangle(
                width=10 / 64, height=0.18,
                fill_color=SHA_COLOR,
                fill_opacity=0.6 if r < 20 else 0.4,
                stroke_width=0,
            )
            block.align_to(strip_bg, LEFT)
            block.shift(RIGHT * (r * 10 / 64 + 10 / 128))
            block.align_to(strip_bg, DOWN).shift(UP * 0.01)
            filled_blocks.add(block)
            anims.append(FadeIn(block))

            self.play(*anims, run_time=dur, rate_func=linear)

            # Reset border highlights
            if r < 20:
                registers[0].set_stroke(BORDER_LIGHT, width=1, opacity=1)
                registers[4].set_stroke(BORDER_LIGHT, width=1, opacity=1)

        # Block complete flash
        done_flash = Text("Block complete → output feeds next block",
                         color=SHA_COLOR, font_size=18, weight=BOLD)
        done_flash.move_to(DOWN * 3.2)
        self.play(FadeIn(done_flash, shift=UP * 0.15), run_time=0.4)
        self.wait(0.8)

        # Clean up
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)

    # ══════════════════════════════════════════════
    # ACT 2: Merkle-Damgård chain — each block waits
    # ══════════════════════════════════════════════
    def act2_chain(self):
        title = Text("The Merkle-Damgård Chain", color=SHA_COLOR, font_size=28, weight=BOLD)
        subtitle = Text("Each block must wait for the previous block to finish",
                        color=TEXT_DIM, font_size=16)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(title), FadeIn(subtitle), run_time=0.5)
        self.wait(0.5)
        self.play(title.animate.scale(0.7).to_edge(UP, buff=0.3),
                  FadeOut(subtitle), run_time=0.4)

        # Show 8 blocks in a chain
        n_blocks = 8
        chain = VGroup()
        arrows = VGroup()

        # IV node
        iv = RoundedRectangle(
            corner_radius=0.08, width=0.7, height=0.5,
            fill_color=CELL_BG, fill_opacity=1,
            stroke_color=TEXT_DIM, stroke_width=1,
        )
        iv_label = Text("IV", color=TEXT_DIM, font_size=14)
        iv_label.move_to(iv)
        iv_group = VGroup(iv, iv_label)
        chain.add(iv_group)

        for i in range(n_blocks):
            block = RoundedRectangle(
                corner_radius=0.08, width=0.9, height=0.6,
                fill_color=CELL_BG, fill_opacity=1,
                stroke_color=BORDER_LIGHT, stroke_width=1,
            )
            label = Text(f"B{i+1}", color=TEXT, font_size=13)
            rounds = Text("64r", color=TEXT_MUTED, font_size=10)
            label.move_to(block).shift(UP * 0.08)
            rounds.move_to(block).shift(DOWN * 0.12)
            chain.add(VGroup(block, label, rounds))

        chain.arrange(RIGHT, buff=0.35)
        chain.move_to(UP * 0.5)

        for i in range(n_blocks):
            arrow = Arrow(
                chain[i].get_right(), chain[i + 1].get_left(),
                buff=0.06, color=SHA_COLOR, stroke_width=2,
                max_tip_length_to_length_ratio=0.35,
            )
            arrows.add(arrow)

        # Show IV
        self.play(FadeIn(chain[0]), run_time=0.3)

        # Animate chain sequentially — block lights up, processes, then arrow → next
        for i in range(n_blocks):
            block_group = chain[i + 1]
            self.play(FadeIn(block_group, shift=RIGHT * 0.15), run_time=0.2)

            # Processing flash — border lights up amber
            self.play(
                block_group[0].animate.set_stroke(SHA_COLOR, width=2.5),
                run_time=0.15,
            )
            # Internal "rounds" — quick fill animation
            fill_rect = block_group[0].copy().set_fill(SHA_COLOR, opacity=0.25).set_stroke(width=0)
            self.play(FadeIn(fill_rect), run_time=0.2)

            # Done — arrow to next
            block_group[0].set_stroke(SHA_COLOR, width=1.5, opacity=0.6)
            if i < n_blocks - 1:
                self.play(FadeIn(arrows[i]), run_time=0.12)
            else:
                # Last arrow → hash output
                self.play(FadeIn(arrows[i]), run_time=0.12)

        # Hash output
        hash_box = RoundedRectangle(
            corner_radius=0.08, width=1.2, height=0.5,
            fill_color=GREEN, fill_opacity=0.15,
            stroke_color=GREEN, stroke_width=1.5,
        )
        hash_label = Text("H(m)", color=GREEN, font_size=16, weight=BOLD)
        hash_label.move_to(hash_box)
        hash_group = VGroup(hash_box, hash_label)
        hash_group.next_to(chain, RIGHT, buff=0.5)
        last_arrow = Arrow(
            chain[-1].get_right(), hash_group.get_left(),
            buff=0.06, color=GREEN, stroke_width=2,
            max_tip_length_to_length_ratio=0.3,
        )
        self.play(FadeIn(last_arrow), FadeIn(hash_group), run_time=0.3)

        # Callout: the constraint
        constraint = Text(
            "Block 2 cannot start until Block 1 finishes. No parallelism possible.",
            color=SHA_COLOR, font_size=16,
        )
        constraint.move_to(DOWN * 1.2)
        self.play(FadeIn(constraint), run_time=0.4)

        # Timing annotation
        timing = Text(
            "8 blocks × 64 rounds = 512 rounds, strictly sequential",
            color=TEXT_DIM, font_size=14,
        )
        timing.next_to(constraint, DOWN, buff=0.25)
        self.play(FadeIn(timing), run_time=0.3)
        self.wait(1.0)

        # Transition text
        but_text = Text("But 1 MB isn't 8 blocks...", color=TEXT_DIM, font_size=20)
        but_text.move_to(DOWN * 2.5)
        self.play(FadeIn(but_text), run_time=0.4)
        self.wait(0.6)

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)

    # ══════════════════════════════════════════════
    # ACT 3: The full 16,384-block queue
    # ══════════════════════════════════════════════
    def act3_full_scale(self):
        title = Text("1 MB = 16,384 blocks", color=SHA_COLOR, font_size=30, weight=BOLD)
        subtitle = Text("Each one waiting in line", color=TEXT_DIM, font_size=18)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(title), FadeIn(subtitle), run_time=0.5)
        self.wait(0.4)
        self.play(FadeOut(title), FadeOut(subtitle), run_time=0.4)

        # Show a 128×128 grid = 16,384 cells
        # Each cell = 1 block. Fill them sequentially left→right, top→bottom.
        grid_size = 128
        cell_px = 10.5 / grid_size  # fit in ~10.5 units wide
        total_cells = grid_size * grid_size

        # Draw the empty grid as a single rectangle (rendering 16K squares is too slow)
        grid_outline = Rectangle(
            width=cell_px * grid_size,
            height=cell_px * grid_size,
            stroke_color=BORDER, stroke_width=1,
            fill_color=CELL_BG, fill_opacity=0.5,
        )
        grid_outline.move_to(LEFT * 0.5 + DOWN * 0.1)

        grid_label = Text("128 × 128 = 16,384 blocks", color=TEXT_DIM, font_size=14)
        grid_label.next_to(grid_outline, UP, buff=0.2)

        self.play(FadeIn(grid_outline), FadeIn(grid_label), run_time=0.4)

        # Animate filling with a growing rectangle (scan line effect)
        # We'll show ~40 scan line steps
        scan_steps = 50
        rows_per_step = grid_size / scan_steps
        grid_left = grid_outline.get_left()[0]
        grid_top = grid_outline.get_top()[1]
        grid_width = cell_px * grid_size
        grid_height = cell_px * grid_size

        fill_rect = Rectangle(
            width=grid_width, height=0.001,
            fill_color=SHA_COLOR, fill_opacity=0.35,
            stroke_width=0,
        )
        fill_rect.align_to(grid_outline, UP).align_to(grid_outline, LEFT)
        self.add(fill_rect)

        # Counter
        block_counter = Text("0 / 16,384", color=SHA_COLOR, font_size=18)
        block_counter.next_to(grid_outline, DOWN, buff=0.3)
        self.add(block_counter)

        round_counter = Text("0 / 1,048,576 rounds", color=TEXT_DIM, font_size=14)
        round_counter.next_to(block_counter, DOWN, buff=0.15)
        self.add(round_counter)

        for step in range(1, scan_steps + 1):
            progress = step / scan_steps
            current_rows = min(progress * grid_size, grid_size)
            fill_height = current_rows * cell_px

            new_fill = Rectangle(
                width=grid_width, height=max(0.001, fill_height),
                fill_color=SHA_COLOR, fill_opacity=0.35,
                stroke_width=0,
            )
            new_fill.align_to(grid_outline, UP).align_to(grid_outline, LEFT)

            blocks_done = int(progress * total_cells)
            rounds_done = blocks_done * 64

            new_bc = Text(f"{blocks_done:,} / 16,384", color=SHA_COLOR, font_size=18)
            new_bc.move_to(block_counter)

            new_rc = Text(f"{rounds_done:,} / 1,048,576 rounds", color=TEXT_DIM, font_size=14)
            new_rc.move_to(round_counter)

            # Speed up as we go
            dur = 0.12 if step < 10 else 0.04

            self.play(
                Transform(fill_rect, new_fill),
                Transform(block_counter, new_bc),
                Transform(round_counter, new_rc),
                run_time=dur, rate_func=linear,
            )

        # Final stats
        self.wait(0.3)
        stat = Text(
            "1,048,576 rounds — all sequential, single-threaded",
            color=SHA_COLOR, font_size=18, weight=BOLD,
        )
        stat.to_edge(DOWN, buff=0.3)
        self.play(FadeIn(stat, shift=UP * 0.15), run_time=0.4)
        self.wait(1.0)

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)

    # ══════════════════════════════════════════════
    # ACT 4: BLAKE3 contrast — parallel chunks + tree
    # ══════════════════════════════════════════════
    def act4_blake3_contrast(self):
        title = Text("Now watch BLAKE3 do the same 1 MB", color=BLAKE_BRIGHT, font_size=28, weight=BOLD)
        self.play(FadeIn(title), run_time=0.5)
        self.wait(0.4)
        self.play(FadeOut(title), run_time=0.3)

        # ── Split screen: SHA-256 left, BLAKE3 right ──
        divider = Line(UP * 3.5, DOWN * 3.5, color=BORDER, stroke_width=1)
        self.add(divider)

        sha_label = Text("SHA-256", color=SHA_COLOR, font_size=22, weight=BOLD)
        sha_label.move_to(LEFT * 3.5 + UP * 3.2)
        blake_label = Text("BLAKE3", color=BLAKE_COLOR, font_size=22, weight=BOLD)
        blake_label.move_to(RIGHT * 3.5 + UP * 3.2)
        self.play(FadeIn(sha_label), FadeIn(blake_label), run_time=0.3)

        # ── SHA-256 side: 16,384 blocks, sequential ──
        sha_info = VGroup(
            Text("16,384 blocks", color=TEXT, font_size=16),
            Text("× 64 rounds each", color=TEXT_DIM, font_size=14),
            Text("= 1,048,576 rounds", color=SHA_COLOR, font_size=16, weight=BOLD),
            Text("sequential", color=TEXT_DIM, font_size=13),
        ).arrange(DOWN, buff=0.12)
        sha_info.move_to(LEFT * 3.5 + UP * 1.5)

        # Small grid representation
        sha_grid = Rectangle(
            width=2.8, height=2.8,
            fill_color=CELL_BG, fill_opacity=0.5,
            stroke_color=BORDER, stroke_width=1,
        )
        sha_grid.move_to(LEFT * 3.5 + DOWN * 1.0)
        sha_grid_label = Text("128 × 128", color=TEXT_MUTED, font_size=11)
        sha_grid_label.next_to(sha_grid, DOWN, buff=0.1)

        # ── BLAKE3 side: 1,024 chunks, parallel ──
        blake_info = VGroup(
            Text("1,024 chunks", color=TEXT, font_size=16),
            Text("× 7 rounds each", color=TEXT_DIM, font_size=14),
            Text("= 7,168 rounds", color=BLAKE_COLOR, font_size=16, weight=BOLD),
            Text("all at once", color=BLAKE_BRIGHT, font_size=13, weight=BOLD),
        ).arrange(DOWN, buff=0.12)
        blake_info.move_to(RIGHT * 3.5 + UP * 1.5)

        blake_grid = Rectangle(
            width=2.8, height=2.8,
            fill_color=CELL_BG, fill_opacity=0.5,
            stroke_color=BORDER, stroke_width=1,
        )
        blake_grid.move_to(RIGHT * 3.5 + DOWN * 1.0)
        blake_grid_label = Text("32 × 32", color=TEXT_MUTED, font_size=11)
        blake_grid_label.next_to(blake_grid, DOWN, buff=0.1)

        self.play(
            FadeIn(sha_info), FadeIn(sha_grid), FadeIn(sha_grid_label),
            FadeIn(blake_info), FadeIn(blake_grid), FadeIn(blake_grid_label),
            run_time=0.5,
        )
        self.wait(0.3)

        # ── Animate: SHA-256 fills slowly, BLAKE3 fills instantly ──
        # SHA-256: slow scan
        sha_fill = Rectangle(
            width=2.78, height=0.001,
            fill_color=SHA_COLOR, fill_opacity=0.35, stroke_width=0,
        )
        sha_fill.align_to(sha_grid, UP).align_to(sha_grid, LEFT).shift(RIGHT * 0.01 + DOWN * 0.01)
        self.add(sha_fill)

        # BLAKE3: entire grid lights up at once
        blake_fill = Rectangle(
            width=2.78, height=2.78,
            fill_color=BLAKE_COLOR, fill_opacity=0.0, stroke_width=0,
        )
        blake_fill.move_to(blake_grid)

        # Start both — BLAKE3 fills instantly
        self.play(
            blake_fill.animate.set_fill(BLAKE_COLOR, opacity=0.5),
            run_time=0.4,
            rate_func=rush_from,
        )

        # BLAKE3 done label
        blake_done = Text("DONE", color=GREEN, font_size=28, weight=BOLD)
        blake_done.move_to(blake_grid)
        blake_tree_note = Text("+ 10 tree merge levels", color=TEXT_DIM, font_size=12)
        blake_tree_note.next_to(blake_grid, DOWN, buff=0.35)

        self.play(FadeIn(blake_done, scale=1.2), FadeIn(blake_tree_note), run_time=0.3)

        # SHA-256 is still grinding...
        sha_pct_text = Text("0%", color=SHA_COLOR, font_size=16)
        sha_pct_text.move_to(sha_grid)
        self.add(sha_pct_text)

        # Slowly fill SHA-256 while BLAKE3 sits complete
        n_steps = 30
        for step in range(1, n_steps + 1):
            progress = step / n_steps
            fill_h = progress * 2.78
            new_sha_fill = Rectangle(
                width=2.78, height=max(0.001, fill_h),
                fill_color=SHA_COLOR, fill_opacity=0.3, stroke_width=0,
            )
            new_sha_fill.align_to(sha_grid, UP).align_to(sha_grid, LEFT)
            new_sha_fill.shift(RIGHT * 0.01 + DOWN * 0.01)

            new_pct = Text(f"{int(progress * 100)}%", color=SHA_COLOR, font_size=16)
            new_pct.move_to(sha_grid)

            dur = 0.08 if step < 10 else 0.04
            self.play(
                Transform(sha_fill, new_sha_fill),
                Transform(sha_pct_text, new_pct),
                run_time=dur, rate_func=linear,
            )

        sha_done = Text("DONE", color=SHA_COLOR, font_size=22, weight=BOLD)
        sha_done.move_to(sha_grid)
        self.play(Transform(sha_pct_text, sha_done), run_time=0.3)

        self.wait(0.5)

        # ── Final verdict ──
        verdict_bg = RoundedRectangle(
            corner_radius=0.12, width=10, height=1.4,
            fill_color=SURFACE, fill_opacity=0.95,
            stroke_color=BLAKE_COLOR, stroke_width=1.5,
        )
        verdict_bg.to_edge(DOWN, buff=0.1)

        v1 = Text("SHA-256: 1,048,576 rounds (sequential)", color=SHA_COLOR, font_size=17)
        v2 = Text("BLAKE3:      7,168 rounds (parallel)", color=BLAKE_BRIGHT, font_size=17)
        v3 = Text("146× fewer rounds — and they all run at once",
                   color=TEXT_BRIGHT, font_size=18, weight=BOLD)
        verdict = VGroup(v1, v2, v3).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        verdict.move_to(verdict_bg)

        self.play(
            FadeIn(verdict_bg, shift=UP * 0.2),
            FadeIn(verdict, shift=UP * 0.2),
            run_time=0.6,
        )
        self.wait(2.5)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
