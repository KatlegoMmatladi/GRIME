const vscode = require('vscode');
const { resolve_root_icon, resolve_node_icon } = require('../utils/icon_resolver');
/**
 * Represents a single annotation or type group in the Tree View.
 * @extends vscode.TreeItem
 * 
 */
class AnnotationTreeItem extends vscode.TreeItem{
    /**
     * 
     * @param {string} label 
     * @param {vscode.TreeItemCollapsibleState} collapsible_state 
     * @param {object|null} [annotation] Optional annotation data 
     * @param {string|null} annotation_type
     */
    constructor(label, collapsible_state, annotation = null, annotation_type = null){
        super(label, collapsible_state);
        this.annotation = annotation; 
        this.annotation_type = annotation_type;

        if (annotation){
            this.tooltip = `${annotation.description}${annotation.file ? ` - ${annotation.file}:${annotation.line || ''}` : ''}`;
            this.description = annotation.file ? `${annotation.file}${annotation.line ? ':' + annotation.line : ''}` : '';

            this.iconPath = {
                light: resolve_node_icon('light'),
                dark: resolve_node_icon('dark')
            };

            this.contextValue = 'grime_annotation';
        }

        if (this.annotation_type && !annotation){
            this.iconPath = {
                light : resolve_root_icon('light', annotation_type),
                dark : resolve_root_icon('dark', annotation_type)
            }
        }
    }
}

/**
 * Provides Tree View data for Grime Annotations
 */
class AnnotationTreeProvider{

    /** 
     * @param {import('./storage_service')} storage_service 
     */
    constructor(storage_service){
        this.storage_service = storage_service; 
        this.types = ['todo', 'fixme', 'chore', 'note'];
        this._on_did_change_tree_data = new vscode.EventEmitter();
    }

    /**
     * Returns children for a given element.
     * If Element is null, return top-level nodes.
     * 
     * @param {AnnotationTreeItem|null} element 
     * @returns {Promise<AnnotationTreeItem[]>}
     */

    async getChildren(element){
        /** Returns only annotation types. */
        if(!element){
            return this.types.map(type => new AnnotationTreeItem(
                type.replace(/^./, char => char.toUpperCase()), 
                vscode.TreeItemCollapsibleState.Collapsed,
                null, 
                type
            )); 
        }else if (element.annotation_type && this.types.includes(element.annotation_type)){
           const assert_element = /** @type {'todo' | 'fixme' | 'chore' | 'note'} */ (element.annotation_type);
           const entries = this.storage_service.load_entries_by_type(assert_element); 
           return entries.map(entry => new AnnotationTreeItem(
                entry.description, 
                vscode.TreeItemCollapsibleState.None,
                entry,
                assert_element
           ));
        }

        return [];
    }

    /**
     * Returns a TreeItem representation of an element. 
     * @param {AnnotationTreeItem} element 
     * @returns {vscode.TreeItem}
     * 
     */

    getTreeItem(element){
        return element; 
    }

    /**
     * Updates Tree View when change is detected. 
     */
    refresh(){
        this._on_did_change_tree_data.fire();
    }

    /**
     * Event listener for Tree View Changes. 
     */

    get onDidChangeTreeData(){
        return this._on_did_change_tree_data.event; 
    }
}

module.exports = AnnotationTreeProvider;