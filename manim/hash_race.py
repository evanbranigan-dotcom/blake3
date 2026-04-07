"""
Hash Race: SHA-256 (64 rounds) vs BLAKE3 (7 rounds), side by side.
Both start on the same frame. BLAKE3 finishes first — dramatically.

Mirrors the site's renderer.ts race logic but leverages Manim's
frame-precise animation, camera control, and easing.
"""

from manim import *
import numpy as np

# ── Design system (from DESIGN.md) ──
BG = "#0a0a0f"
SURFACE = "#0d0d14"
CELL_BG = "#111118"
BORDER = "#1e1e28"
TEXT_BRIGHT = "#e0e0e8"
TEXT_DIM = "#666666"
TEXT_MUTED = "#444444"
SHA_COLOR = "#f59e0b"
BLAKE_COLOR = "#7c3aed"
BLAKE_BRIGHT = "#a78bfa"
GREEN = "#22c55e"

SHA_ROUNDS = 64
BLAKE_ROUNDS = 7  # 14 half-rounds shown as 7 full rounds


class HashRace(Scene):
    def construct(self):
        self.camera.background_color = BG

        # ── Layout: two panels side by side ──
        divider = Line(UP * 3.5, DOWN * 3.5, color=BORDER, stroke_width=1)
        self.add(divider)

        # Panel labels
        sha_title = Text("SHA-256", color=SHA_COLOR, font_size=24, weight=BOLD)
        sha_title.move_to(LEFT * 3.5 + UP * 3.2)
        blake_title = Text("BLAKE3", color=BLAKE_COLOR, font_size=24, weight=BOLD)
        blake_title.move_to(RIGHT * 3.5 + UP * 3.2)

        sha_subtitle = Text("64 rounds, sequential", color=TEXT_DIM, font_size=14)
        sha_subtitle.next_to(sha_title, DOWN, buff=0.15)
        blake_subtitle = Text("7 rounds, parallel", color=TEXT_DIM, font_size=14)
        blake_subtitle.next_to(blake_title, DOWN, buff=0.15)

        self.play(
            FadeIn(sha_title), FadeIn(blake_title),
            FadeIn(sha_subtitle), FadeIn(blake_subtitle),
            run_time=0.5,
        )

        # ── Round towers ──
        # SHA-256: 64 tiny blocks in a column (8 rows × 8 cols grid)
        sha_tower = self._build_tower(8, 8, LEFT * 3.5 + DOWN * 0.3, SHA_COLOR)
        blake_tower = self._build_tower(7, 1, RIGHT * 3.5 + DOWN * 0.3, BLAKE_COLOR)

        sha_tower_label = Text("rounds", color=TEXT_MUTED, font_size=11)
        sha_tower_label.next_to(sha_tower, UP, buff=0.2)
        blake_tower_label = Text("rounds", color=TEXT_MUTED, font_size=11)
        blake_tower_label.next_to(blake_tower, UP, buff=0.2)

        self.add(sha_tower, blake_tower, sha_tower_label, blake_tower_label)

        # ── Round counters ──
        sha_counter = Text("0 / 64", color=SHA_COLOR, font_size=18, font="SF Mono")
        sha_counter.next_to(sha_tower, DOWN, buff=0.3)
        blake_counter = Text("0 / 7", color=BLAKE_COLOR, font_size=18, font="SF Mono")
        blake_counter.next_to(blake_tower, DOWN, buff=0.3)
        self.add(sha_counter, blake_counter)

        # ── Progress bars ──
        sha_bar_bg = RoundedRectangle(
            corner_radius=0.06, width=4.5, height=0.18,
            fill_color=CELL_BG, fill_opacity=1, stroke_color=BORDER, stroke_width=1,
        )
        sha_bar_bg.move_to(LEFT * 3.5 + DOWN * 2.8)
        blake_bar_bg = sha_bar_bg.copy().move_to(RIGHT * 3.5 + DOWN * 2.8)

        sha_bar_fill = RoundedRectangle(
            corner_radius=0.06, width=0.01, height=0.16,
            fill_color=SHA_COLOR, fill_opacity=0.8, stroke_width=0,
        )
        sha_bar_fill.align_to(sha_bar_bg, LEFT).shift(RIGHT * 0.02)
        blake_bar_fill = RoundedRectangle(
            corner_radius=0.06, width=0.01, height=0.16,
            fill_color=BLAKE_COLOR, fill_opacity=0.8, stroke_width=0,
        )
        blake_bar_fill.align_to(blake_bar_bg, LEFT).shift(RIGHT * 0.02)

        self.add(sha_bar_bg, blake_bar_bg, sha_bar_fill, blake_bar_fill)

        # ── Percent labels ──
        sha_pct = Text("0%", color=SHA_COLOR, font_size=14)
        sha_pct.next_to(sha_bar_bg, RIGHT, buff=0.15)
        blake_pct = Text("0%", color=BLAKE_COLOR, font_size=14)
        blake_pct.next_to(blake_bar_bg, RIGHT, buff=0.15)
        self.add(sha_pct, blake_pct)

        # ── Status labels ──
        sha_status = Text("HASHING...", color=TEXT_DIM, font_size=12)
        sha_status.next_to(sha_bar_bg, DOWN, buff=0.2)
        blake_status = Text("HASHING...", color=TEXT_DIM, font_size=12)
        blake_status.next_to(blake_bar_bg, DOWN, buff=0.2)
        self.add(sha_status, blake_status)

        self.wait(0.3)

        # ── THE RACE ──
        # Total ticks = 64 (SHA-256 rounds). BLAKE3 finishes at tick ~14.
        # Each tick = 1 SHA-256 round. BLAKE3 does 0.5 rounds per tick (14 half-rounds).
        # But visually: BLAKE3 completes 7 rounds in 14 ticks.

        tick_duration = 0.08  # seconds per tick at 60fps = ~5 frames each
        total_ticks = 64
        blake_finish_tick = 14  # 7 rounds × 2 ticks per round
        blake_done = False
        dramatic_pause_done = False

        max_bar_width = 4.46  # slightly less than bg

        for tick in range(1, total_ticks + 1):
            sha_round = tick
            blake_round = min(tick / 2, 7)
            blake_round_int = min(int(np.ceil(tick / 2)), 7)

            anims = []

            # ── SHA-256 tower: light up block ──
            row = (tick - 1) // 8
            col = (tick - 1) % 8
            idx = row * 8 + col
            if idx < len(sha_tower):
                anims.append(
                    sha_tower[idx].animate.set_fill(SHA_COLOR, opacity=0.7)
                    .set_stroke(SHA_COLOR, width=1.5, opacity=0.8)
                )

            # ── BLAKE3 tower: light up block (every 2 ticks) ──
            if tick <= blake_finish_tick and tick % 2 == 0:
                blake_idx = tick // 2 - 1
                if blake_idx < len(blake_tower):
                    anims.append(
                        blake_tower[blake_idx].animate.set_fill(BLAKE_COLOR, opacity=0.7)
                        .set_stroke(BLAKE_COLOR, width=1.5, opacity=0.8)
                    )

            # ── Progress bars ──
            sha_progress = tick / total_ticks
            sha_new_width = max(0.01, sha_progress * max_bar_width)
            new_sha_fill = RoundedRectangle(
                corner_radius=0.06, width=sha_new_width, height=0.16,
                fill_color=SHA_COLOR, fill_opacity=0.8, stroke_width=0,
            )
            new_sha_fill.align_to(sha_bar_bg, LEFT).shift(RIGHT * 0.02)
            anims.append(Transform(sha_bar_fill, new_sha_fill))

            if not blake_done:
                blake_progress = blake_round / 7
                blake_new_width = max(0.01, blake_progress * max_bar_width)
                new_blake_fill = RoundedRectangle(
                    corner_radius=0.06, width=blake_new_width, height=0.16,
                    fill_color=BLAKE_COLOR, fill_opacity=0.8, stroke_width=0,
                )
                new_blake_fill.align_to(blake_bar_bg, LEFT).shift(RIGHT * 0.02)
                anims.append(Transform(blake_bar_fill, new_blake_fill))

            # ── Update counters ──
            new_sha_counter = Text(
                f"{sha_round} / 64", color=SHA_COLOR, font_size=18, font="SF Mono"
            )
            new_sha_counter.move_to(sha_counter)
            anims.append(Transform(sha_counter, new_sha_counter))

            new_sha_pct = Text(
                f"{int(sha_progress * 100)}%", color=SHA_COLOR, font_size=14
            )
            new_sha_pct.next_to(sha_bar_bg, RIGHT, buff=0.15)
            anims.append(Transform(sha_pct, new_sha_pct))

            if not blake_done:
                new_blake_counter = Text(
                    f"{blake_round_int} / 7", color=BLAKE_COLOR, font_size=18, font="SF Mono"
                )
                new_blake_counter.move_to(blake_counter)
                anims.append(Transform(blake_counter, new_blake_counter))

                new_blake_pct = Text(
                    f"{int(blake_progress * 100)}%", color=BLAKE_COLOR, font_size=14
                )
                new_blake_pct.next_to(blake_bar_bg, RIGHT, buff=0.15)
                anims.append(Transform(blake_pct, new_blake_pct))

            # Play this tick
            self.play(*anims, run_time=tick_duration, rate_func=linear)

            # ── BLAKE3 finishes! ──
            if tick == blake_finish_tick and not blake_done:
                blake_done = True

                # "DONE" overlay
                done_text = Text("DONE", color=GREEN, font_size=36, weight=BOLD)
                done_text.move_to(RIGHT * 3.5 + UP * 0.6)

                # Replace status
                new_blake_status = Text("COMPLETE", color=GREEN, font_size=12)
                new_blake_status.move_to(blake_status)

                # Green glow on bar
                new_blake_fill_done = RoundedRectangle(
                    corner_radius=0.06, width=max_bar_width, height=0.16,
                    fill_color=GREEN, fill_opacity=0.9, stroke_width=0,
                )
                new_blake_fill_done.align_to(blake_bar_bg, LEFT).shift(RIGHT * 0.02)

                self.play(
                    FadeIn(done_text, scale=1.3),
                    Transform(blake_bar_fill, new_blake_fill_done),
                    Transform(blake_status, new_blake_status),
                    run_time=0.3,
                    rate_func=rush_from,
                )

                # Dramatic pause — hold while SHA-256 is only at 22%
                freeze_label = Text(
                    f"SHA-256: {int(tick/64*100)}% done",
                    color=TEXT_DIM, font_size=16,
                )
                freeze_label.to_edge(DOWN, buff=0.3)
                self.play(FadeIn(freeze_label), run_time=0.3)
                self.wait(1.0)
                self.play(FadeOut(freeze_label), run_time=0.2)

                # Speed up SHA-256's remaining grind
                tick_duration = 0.04

        # ── SHA-256 finally finishes ──
        sha_done_text = Text("DONE", color=SHA_COLOR, font_size=28, weight=BOLD)
        sha_done_text.move_to(LEFT * 3.5 + UP * 0.6)

        new_sha_status = Text("COMPLETE", color=SHA_COLOR, font_size=12)
        new_sha_status.move_to(sha_status)

        self.play(
            FadeIn(sha_done_text, scale=1.1),
            Transform(sha_status, new_sha_status),
            run_time=0.4,
        )
        self.wait(0.5)

        # ── Verdict ──
        verdict_bg = RoundedRectangle(
            corner_radius=0.15, width=6, height=1.2,
            fill_color=SURFACE, fill_opacity=0.95,
            stroke_color=BLAKE_COLOR, stroke_width=1.5,
        )
        verdict_bg.to_edge(DOWN, buff=0.15)

        verdict_line1 = Text(
            "BLAKE3 finished in 7 rounds",
            color=BLAKE_BRIGHT, font_size=20, weight=BOLD,
        )
        verdict_line2 = Text(
            "SHA-256 needed 64 — that's 9× more work",
            color=TEXT_DIM, font_size=16,
        )
        verdict = VGroup(verdict_line1, verdict_line2).arrange(DOWN, buff=0.12)
        verdict.move_to(verdict_bg)

        self.play(
            FadeIn(verdict_bg, shift=UP * 0.2),
            FadeIn(verdict, shift=UP * 0.2),
            run_time=0.6,
        )
        self.wait(2.0)

        # Fade out
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=0.8)

    def _build_tower(self, rows: int, cols: int, center: np.ndarray, color: str) -> VGroup:
        """Build a grid of small blocks representing rounds."""
        blocks = VGroup()
        cell_size = 0.28
        gap = 0.04

        for row in range(rows):
            for col in range(cols):
                block = Square(
                    side_length=cell_size,
                    fill_color=CELL_BG,
                    fill_opacity=1,
                    stroke_color=BORDER,
                    stroke_width=0.8,
                )
                x = (col - (cols - 1) / 2) * (cell_size + gap)
                y = ((rows - 1) / 2 - row) * (cell_size + gap)
                block.move_to(center + RIGHT * x + UP * y)
                blocks.add(block)

        return blocks
