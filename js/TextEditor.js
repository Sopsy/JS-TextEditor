export default class TextEditor
{
    #buttons = [
        {action: 'bold', name: 'B'},
        {action: 'italic', name: 'I'},
        {action: 'underline', name: 'U'},
        {action: 'strikeThrough', name: 'S'},
        {action: 'undo', name: 'Undo'},
        {action: 'redo', name: 'Redo'},
        {action: 'insertOrderedList', name: 'OL'},
        {action: 'insertUnorderedList', name: 'UL'},
        {action: 'insertHTMLTag', name: 'H4', tag: 'h4'},
        {action: 'insertHTMLTag', name: 'H5', tag: 'h5'},
        {action: 'createLink', name: 'Link'},
        {action: 'unlink', name: 'Remove links'},
        {action: 'removeFormat', name: 'Remove formatting'},
    ];

    constructor()
    {
        for (const textarea of document.body.querySelectorAll('[data-text-editor]')) {
            this.activate(textarea);
        }
    }

    activate(elm)
    {
        elm.hidden = true;
        let editor = document.createElement('div');
        editor.classList.add('text-editor');
        let content = document.createElement('div');
        content.classList.add('input', 'content');
        content.setAttribute('contenteditable', 'true');
        content.innerHTML = elm.value;

        elm.addEventListener('input', () => {
            content.innerHTML = elm.value;
        });

        content.addEventListener('input', () => {
            elm.value = content.innerHTML;
        });

        let toolbar = this.#createToolbar(content, elm);
        editor.append(toolbar);
        editor.append(content);
        elm.before(editor);
        document.execCommand('defaultParagraphSeparator', false, 'p');
    }

    #createToolbar(content, elm)
    {
        let toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');

        for (const button of this.#buttons) {
            let btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = button.name;
            if (button.tag) {
                btn.actionTag = button.tag;
            }
            btn.editorAction = button.action;
            btn.addEventListener('click', this.#buttonClickListener);

            if (
                button.action === 'bold'
                || button.action === 'italic'
                || button.action === 'underline'
                || button.action === 'strikeThrough'
                || button.action === 'insertOrderedList'
                || button.action === 'insertUnorderedList'
                || button.action === 'insertHTMLTag'
                || button.action === 'createLink'
            ) {
                document.addEventListener('selectionchange', () => {
                    btn.classList.remove('active');
                    let selection = getSelection().getRangeAt(0);
                    let parent = selection.startContainer.parentNode.closest('.input.content');
                    if (!parent || parent !== content) {
                        return;
                    }

                    let tag;
                    switch (button.action) {
                        case 'bold':
                            tag = 'b';
                            break;
                        case 'italic':
                            tag = 'i';
                            break;
                        case 'underline':
                            tag = 'u';
                            break;
                        case 'strikeThrough':
                            tag = 'strike';
                            break;
                        case 'insertOrderedList':
                            tag = 'ol';
                            break;
                        case 'insertUnorderedList':
                            tag = 'ul';
                            break;
                        case 'insertHTMLTag':
                            if (button.tag === 'h4') {
                                tag = 'h4';
                            } else if (button.tag === 'h5') {
                                tag = 'h5';
                            }
                            break;
                        case 'createLink':
                            tag = 'a';
                            break;
                    }
                    if (selection.startContainer.parentNode.closest(tag)) {
                        btn.classList.add('active');
                    }
                });
            }

            toolbar.append(btn);
        }
        
        let sourceBtn = document.createElement('button');
        sourceBtn.textContent = 'HTML';
        sourceBtn.classList.add('view-source');
        sourceBtn.type = 'button';

        sourceBtn.addEventListener('click', (e) => {
            if (sourceBtn.classList.contains('active')) {
                sourceBtn.classList.remove('active');
                content.hidden = false;
                elm.hidden = true;
                for (const btn of toolbar.querySelectorAll('button:not(.view-source)')) {
                    btn.hidden = false;
                }
            } else {
                sourceBtn.classList.add('active');
                elm.hidden = false;
                content.hidden = true;
                for (const btn of toolbar.querySelectorAll('button:not(.view-source)')) {
                    btn.hidden = true;
                }
            }
        });

        toolbar.append(sourceBtn);

        return toolbar;
    }

    #buttonClickListener(e)
    {
        let action = e.currentTarget.editorAction;
        let selection = getSelection().getRangeAt(0);
        let contentInput = selection.startContainer.parentNode.closest('.input.content');
        contentInput.focus();

        if (selection.startOffset === selection.endOffset && e.currentTarget.classList.contains('active')) {
            let selection = getSelection();
            let range = document.createRange();
            range.selectNodeContents(selection.getRangeAt(0).startContainer.parentNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            if (action !== 'unlink' && action !== 'removeFormat') {
                e.currentTarget.classList.toggle('active');
            }
        }

        if (action === 'createLink') {
            let currentTag = selection.startContainer.parentNode.closest('a');
            if (currentTag) {
                currentTag.replaceWith(currentTag.textContent);

                contentInput.dispatchEvent(new InputEvent("input"));
                return;
            }

            let url = prompt('Link URL', 'https://google.com/');
            if (!url) {
                return;
            }

            let nofollow = confirm('Nofollow?');
            document.execCommand('createLink', false, url);
            let elm = selection.startContainer.parentNode.closest('a');
            elm.setAttribute('rel', 'noopener noreferrer' + (nofollow ? ' nofollow' : ''));

            contentInput.dispatchEvent(new InputEvent("input"));
            return;
        }

        if (action === 'insertHTMLTag') {
            let tag = e.currentTarget.actionTag ?? '';
            let content = tag;
            if (selection.startOffset !== selection.endOffset) {
                content = selection.toString();
            }

            let currentTag = selection.startContainer.parentNode.closest(tag);
            if (currentTag) {
                let newTag = document.createElement('p');
                newTag.textContent = currentTag.textContent;
                currentTag.replaceWith(newTag);

                contentInput.dispatchEvent(new InputEvent("input"));
                return;
            }

            document.execCommand('insertHTML', false, '<' + tag + '>' + content + '</' + tag + '>');
            let range = document.createRange();
            selection = getSelection();
            range.selectNodeContents(selection.getRangeAt(0).startContainer.parentNode);
            selection.removeAllRanges();
            selection.addRange(range);

            contentInput.dispatchEvent(new InputEvent("input"));
            return;
        }

        document.execCommand(action);
    }
}

Object.freeze(TextEditor.prototype);