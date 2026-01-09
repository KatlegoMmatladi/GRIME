<div align='center'>

<img src="resources/logo/grime.png" alt="Grime logo" width="200">
<h1>Grime V1.</h1>

</div>

---

Ever felt like your codebase is littered with `ToDo`'s, `Chores` or `FixMe`'s? Ever forgot where you noted that bug you discovered on Friday at 4:30 PM? Or have you ever addressed an issue and forgot to remove the `ToDo` annotation? If you said yes to any of these, then Grime is for you. 

Grime is a lightweight VS Code extension that gives you a place to park those thoughts, ideas, chores and "I will fix this later"s without polluting your source code. It keeps your annotations logically tied to your files, but physically stored outside your repo. 

--- 

## Features

- Create annotations (TODO, FIXME, CHORE, NOTE)
- Optional association with the current file
- Workspace-relative file tracking (portable across machines)
- Tree view for all annotations
- Edit and delete annotations
- Navigate directly to associated files (Go To)
- Safe recovery from corrupted storage files

---

## How It Works

Annotations are stored outside of your repository in VS Code's global storage, scoped per workspace. This ensures:

- Your repository remains clean
- Annotations persist across sessions
- Data is not lost if files are moved or the workspace is relocated

Each annotation may optionally be associated with a file. If a file association exists, Grime can navigate directly to it.

---

## Getting Started

1. Open a workspace in VS Code
2. Open the Grime view from the Activity Bar
3. Click the **+** icon or run the command:
   - `Grime: Add Annotation`
4. Follow the prompts to create an annotation.
5. On the TreeView, your newly added annotation will be visible. 

- **Note** : Additonal actions are available on the children nodes (the annotations themselves.)
---

## Commands

| Command | Description |
|--------|-------------|
| Grime: Add Annotation | Create a new annotation |
| Grime: Focus on View | Open the tree view |

Functionality is incrementally added so now commands coming soon. ;-)

---

## Annotation Model

Each annotation follows a stable internal contract:

- `id`: UUID (unique per annotation)
- `type`: annotation category
- `description`: user-authored text
- `created_at`: ISO timestamp
- `file`: workspace-relative path or null
- `line`: 1-based line number or null
- `from_comment`: whether it originated from code parsing

Annotations without file associations are treated as global notes.

---

## Storage

Grime stores data in the following structure:

```
<globalStorage>/grime/
  └─ <workspace_hash>/
       ├─ todos.json
       ├─ fixmes.json
       ├─ chores.json
       └─ notes.json
```

If a storage file becomes corrupted, Grime will automatically back it up and recreate a clean version.

---

## Go To Navigation

If an annotation is associated with a file:

- Grime will open the file
- If a line number exists, the cursor jumps to that line
- If no line is stored, navigation defaults to the first line

If the file no longer exists, Grime will offer to delete the stale annotation.

---

## Roadmap

Planned features include:

- Comment-based annotation parsing
- Line-level precision from parsed comments
- Custom annotation types
- Keyboard-driven workflows
- Visual indicators and badges

These features will be added incrementally.

---

## Release Notes

### 1.0.1

- Initial release
- Core annotation lifecycle
- Tree view and navigation support

--- 

## Contributing

Contributions are welcome.

If you have ideas for improvements, new features, or bug fixes, feel free to:
- Open an issue to discuss the change
- Submit a pull request with a clear description of what you’ve done

Please keep changes focused and aligned with the project’s goals.  
By contributing, you agree that your contributions will be licensed under the MIT License.

---

## License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE.md) file for details.

--- 

Love, 
Katlego Mmatladi. <3