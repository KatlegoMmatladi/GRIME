const vscode = require('vscode');
const path = require('path');

const icons_base_path = path.join(
    __dirname,
    '..',
    '..',
    'resources',
    'icons'
);

/**
 * 
 * @param {'light' | 'dark'} theme 
 * @param {string} annotation_type 
 * @returns {vscode.Uri}
 */
function resolve_root_icon(theme, annotation_type){
    return vscode.Uri.file(
        path.join(icons_base_path, theme, `${annotation_type}.svg`)
    );
}

/**
 * 
 * @param {'light' | 'dark'} theme 
 * @returns {vscode.Uri}
 * 
 */
function resolve_node_icon(theme){
    return vscode.Uri.file(
        path.join(icons_base_path, theme, 'entry.svg')
    );
}

module.exports = {
    resolve_root_icon,
    resolve_node_icon
};