# Pose View

PathPlanner sucks. We're your solution.

For far too long we have been stuck in the middle of the bell curve, chasing both "simplicity" and "performance" with UI based auto writing software. These create neither. Instead you are left with a confusing mess of 1000 paths to do what you know would only have needed a few lines of code to generalize, and you aren't even winning worlds.

> "We use pin-to-point." —Sudhir Chebiyyam, 2025 World Champion, probably

Cheesy Poofs, Jack in the Bot, OP Robotics, every team worth their salt is using pin-to-point. Why are you letting your team fall behind?

Pose View allows you to hover over a Pose2d in your code and see its position right in VS Code. With this extension you can finally get the convenience of PathPlanner or Choreo while breaking free from their constraints, unlocking your robots ultimate potential.

Join the dark side. Use Pose View.

## MVP Plans

- [ ] Detect when hovering over Pose2d & extract pose info
- [ ] Display hover window showing pose
- [ ] Make the hover window pose draggable to edit code

## Further Plans

- [ ] Add support for multiple poses (eg like a trajectory).
There's many ways you could do this lol but perhaps a toggle to show ghosts of other poses in the method, other poses in the field, or if there is an array of poses the ability to hover over that as a trajectory.
- [ ] Add transform support. (Transforms are basically just relative poses so it should be ez.)
- [ ] Add 3d support. Might require like 3js or something skech. Could probably just do the 2d ui plus boxes for elevation, pitch, and roll. (Usually those are just zero.)

---

(below is the default readme for a vscode extension but i think its useful)

## frc-pose-view README

This is the README for your extension "frc-pose-view". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
