# TextEditor
A really simple WYSIWYG editor using contentEditable. With a "view source" -button.
And unfortunately some deprecated JS APIs because there's really nothing to replace them.

## Usage
HTML:
```
<textarea data-text-editor></textarea>
```
JS:
```
new TextEditor();
```

No options, no nothing. It just works. Maybe. Browsers themselves handle quite literally everything with this.