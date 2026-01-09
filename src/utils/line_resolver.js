const vscode = require('vscode');

/**
 * Returns line where the cursor was last in active editor.
 * 
 * @returns {number} [line_number]
 */
function get_cursor_position(){
    const editor = vscode.window.activeTextEditor; 

    if(!editor){
        vscode.window.showWarningMessage('[Grime] No active editor found.');
        return;
    }

    const position = editor.selection.active;
    const line_number = position.line;

    return line_number;
}

module.exports = get_cursor_position;