# Border wall v01 — rejected

Generated for Art Pass C3 to enclose the plaza along the canal bank, wired, and
then cut after review.

## Why

The kit is a single straight-on wall sprite plus a pillar. A straight-on sprite
can only face the camera, so it reads correctly on the northern shore and
nowhere else: on the east and west banks the stones sit side-on to a shore
running vertically, and at the corners the run does not turn at all. No amount
of placement work fixes this, and the placement work was substantial — the run
had to be stepped by arc length rather than by angle, because sampling an
ellipse by angle bunches segments at the ends and strands them along the flat
sides.

The masonry also competed with the canal for the same silhouette. Both are hard
horizontal bands at the same radius, so the wall flattened the shoreline that
the water tileset had just been generated to articulate.

## What it would take

An oriented kit, not one sprite: north, south, east and west runs plus inner and
outer corners, selected per segment from the bank's local direction — the same
Wang-style neighbour lookup the terrain layers already use. Worth doing as its
own pass rather than as a corner of a density pass.

Until then the treeline carries the boundary, which it does without needing to
know which way it is facing.
