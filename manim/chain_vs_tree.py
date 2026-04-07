"""
Chain vs Tree: SHA-256 sequential processing vs BLAKE3 parallel processing.
The core architectural difference, animated from first principles.
"""

from manim import *

# Colors matching the site's design system
SHA_COLOR = "#f59e0b"  # amber
BLAKE_COLOR = "#7c3aed"  # purple
BG_COLOR = "#0f1117"  # dark bg
TEXT_COLOR = "#e2e8f0"
DIM_COLOR = "#64748b"


class ChainVsTree(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # ── Title ──
        title = Text("How hash functions process data", color=TEXT_COLOR, font_size=32)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=0.8)
        self.wait(0.5)

        # ── Act 1: SHA-256 Sequential Chain ──
        sha_label = Text("SHA-256", color=SHA_COLOR, font_size=28, weight=BOLD)
        sha_label.move_to(UP * 2)

        sha_sub = Text("sequential — each block waits for the last", color=DIM_COLOR, font_size=18)
        sha_sub.next_to(sha_label, DOWN, buff=0.2)

        self.play(
            FadeOut(title),
            FadeIn(sha_label),
            FadeIn(sha_sub),
            run_time=0.6,
        )

        # Build 6-block chain
        n_blocks = 6
        blocks = VGroup()
        arrows = VGroup()

        for i in range(n_blocks):
            block = RoundedRectangle(
                corner_radius=0.1,
                width=0.8,
                height=0.55,
                fill_color=SHA_COLOR,
                fill_opacity=0.15,
                stroke_color=SHA_COLOR,
                stroke_width=2,
            )
            label = Text(f"B{i+1}", color=SHA_COLOR, font_size=16)
            label.move_to(block)
            group = VGroup(block, label)
            blocks.add(group)

        blocks.arrange(RIGHT, buff=0.5)
        blocks.move_to(DOWN * 0.2)

        for i in range(n_blocks - 1):
            arrow = Arrow(
                blocks[i].get_right(),
                blocks[i + 1].get_left(),
                buff=0.08,
                color=SHA_COLOR,
                stroke_width=2,
                max_tip_length_to_length_ratio=0.3,
            )
            arrows.add(arrow)

        # Animate: blocks appear one by one, each waiting for the previous
        self.play(FadeIn(blocks[0], scale=0.8), run_time=0.4)
        for i in range(1, n_blocks):
            # Light up previous block to show it's "done"
            self.play(
                blocks[i - 1][0].animate.set_fill(SHA_COLOR, opacity=0.5),
                FadeIn(arrows[i - 1]),
                run_time=0.25,
            )
            self.play(FadeIn(blocks[i], scale=0.8), run_time=0.3)

        # Final block done
        self.play(blocks[-1][0].animate.set_fill(SHA_COLOR, opacity=0.5), run_time=0.25)

        # Time indicator
        sha_time = Text("6 steps", color=SHA_COLOR, font_size=20)
        sha_time.next_to(blocks, DOWN, buff=0.5)
        self.play(FadeIn(sha_time), run_time=0.3)
        self.wait(0.8)

        # ── Transition ──
        sha_group = VGroup(sha_label, sha_sub, blocks, arrows, sha_time)
        self.play(sha_group.animate.scale(0.55).to_edge(LEFT, buff=0.4).shift(DOWN * 0.3), run_time=0.8)

        vs_text = Text("vs", color=DIM_COLOR, font_size=24)
        vs_text.move_to(ORIGIN)
        self.play(FadeIn(vs_text), run_time=0.3)

        # ── Act 2: BLAKE3 Parallel Tree ──
        blake_label = Text("BLAKE3", color=BLAKE_COLOR, font_size=28, weight=BOLD)
        blake_sub = Text("parallel — all chunks at once", color=DIM_COLOR, font_size=18)

        blake_label.move_to(RIGHT * 3.2 + UP * 2.2)
        blake_sub.next_to(blake_label, DOWN, buff=0.2)

        self.play(FadeIn(blake_label), FadeIn(blake_sub), run_time=0.6)

        # Build tree: 4 leaves → 2 parents → 1 root
        leaf_size = 0.5
        leaves = VGroup()
        for i in range(4):
            leaf = RoundedRectangle(
                corner_radius=0.08,
                width=leaf_size,
                height=leaf_size,
                fill_color=BLAKE_COLOR,
                fill_opacity=0.15,
                stroke_color=BLAKE_COLOR,
                stroke_width=2,
            )
            label = Text(f"C{i+1}", color=BLAKE_COLOR, font_size=14)
            label.move_to(leaf)
            leaves.add(VGroup(leaf, label))

        leaves.arrange(RIGHT, buff=0.4)
        leaves.move_to(RIGHT * 3.2 + DOWN * 0.8)

        parents = VGroup()
        for i in range(2):
            node = RoundedRectangle(
                corner_radius=0.08,
                width=leaf_size * 1.1,
                height=leaf_size * 1.1,
                fill_color=BLAKE_COLOR,
                fill_opacity=0.15,
                stroke_color=BLAKE_COLOR,
                stroke_width=2,
            )
            parents.add(node)

        parents.arrange(RIGHT, buff=1.2)
        parents.move_to(RIGHT * 3.2 + UP * 0.1)

        root = RoundedRectangle(
            corner_radius=0.08,
            width=leaf_size * 1.3,
            height=leaf_size * 1.3,
            fill_color=BLAKE_COLOR,
            fill_opacity=0.15,
            stroke_color=BLAKE_COLOR,
            stroke_width=2,
        )
        root_label = Text("H", color=BLAKE_COLOR, font_size=16, weight=BOLD)
        root.move_to(RIGHT * 3.2 + UP * 1.0)
        root_label.move_to(root)

        # Tree edges
        tree_edges = VGroup()
        for i, leaf in enumerate(leaves):
            parent = parents[i // 2]
            edge = Line(
                leaf.get_top(),
                parent.get_bottom(),
                color=BLAKE_COLOR,
                stroke_width=1.5,
                stroke_opacity=0.5,
            )
            tree_edges.add(edge)

        for parent in parents:
            edge = Line(
                parent.get_top(),
                root.get_bottom(),
                color=BLAKE_COLOR,
                stroke_width=1.5,
                stroke_opacity=0.5,
            )
            tree_edges.add(edge)

        # Animate: all leaves at once (parallel!)
        self.play(
            *[FadeIn(leaf, scale=0.8) for leaf in leaves],
            run_time=0.5,
        )
        # All leaves light up simultaneously
        self.play(
            *[leaf[0].animate.set_fill(BLAKE_COLOR, opacity=0.5) for leaf in leaves],
            *[FadeIn(edge) for edge in tree_edges[:4]],
            run_time=0.4,
        )
        # Parents merge in parallel
        self.play(
            *[FadeIn(parent, scale=0.8) for parent in parents],
            run_time=0.4,
        )
        self.play(
            *[parent.animate.set_fill(BLAKE_COLOR, opacity=0.5) for parent in parents],
            *[FadeIn(edge) for edge in tree_edges[4:]],
            run_time=0.4,
        )
        # Root
        self.play(FadeIn(root, scale=0.8), FadeIn(root_label), run_time=0.4)
        self.play(root.animate.set_fill(BLAKE_COLOR, opacity=0.5), run_time=0.3)

        # Time indicator
        blake_time = Text("3 steps", color=BLAKE_COLOR, font_size=16)
        blake_time.next_to(leaves, DOWN, buff=0.4)
        self.play(FadeIn(blake_time), run_time=0.3)

        self.wait(0.5)

        # ── Act 3: Punchline ──
        punchline = Text(
            "Same data. Half the time.",
            color=TEXT_COLOR,
            font_size=28,
            weight=BOLD,
        )
        punchline.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(punchline, shift=UP * 0.3), run_time=0.6)
        self.wait(1.5)

        # Fade everything
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=0.8)
        self.wait(0.3)
