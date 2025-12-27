# Pose View

PathPlanner sucks. We're your solution.

For far too long we have been stuck in the middle of the bell curve, chasing both "simplicity" and "performance" with UI based auto writing software. These create neither. Instead you are left with a confusing mess of 1000 paths to do what you know would only have needed a few lines of code to generalize, and you aren't even winning worlds.

> "We use path-to-point." —Sudhir Chebiyyam, 2025 World Champion, probably

Cheesy Poofs, Jack in the Bot, OP Robotics, every team worth their salt is using path-to-point. Why are you letting your team fall behind?

Pose View allows you to hover over a Pose2d in your code and see its position right in VS Code. With this extension you can finally get the convenience of PathPlanner or Choreo while breaking free from their constraints, unlocking your robots ultimate potential.

Join the dark side. Use Pose View.

## MVP Plans

- [x] Detect when hovering over Pose2d & extract pose info
- [ ] Display hover window showing pose
- [ ] Make the hover window pose draggable to edit code

## Further Plans

- [ ] Add support for multiple poses (eg like a trajectory).
There's many ways you could do this lol but perhaps a toggle to show ghosts of other poses in the method, other poses in the field, or if there is an array of poses the ability to hover over that as a trajectory.
- [ ] Add transform support. (Transforms are basically just relative poses so it should be ez.)
- [ ] Add 3d support. Might require like 3js or something skech. Could probably just do the 2d ui plus boxes for elevation, pitch, and roll. (Usually those are just zero.)
