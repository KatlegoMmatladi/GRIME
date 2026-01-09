const vscode = require('vscode');
const { v4 : uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const get_cursor_position = require('../utils/line_resolver');
/**
 * 
 * Responsible for prompting the user for annotations/tasks 
 * and persisting them through StorageService. 
 * 
 */
class AnnotationService {

    /**
     * 
     * @param {import('./storage_service')} storage_service
     * @param {import('./annotation_tree_provider')} annotation_tree_provider 
     * 
     */
    constructor(storage_service, annotation_tree_provider = null){
        this.storage_service = storage_service; 
        this.annotation_tree_provider = annotation_tree_provider;
    }
    
    /**
     * Shows prompts to the user and creates an annotation. 
     * returns null if function is cancelled. 
     * 
     * @returns {Promise<void>}
     */
    async prompt_and_store_annotation(){

        const type_picked = await vscode.window.showQuickPick(
            ['todo', 'fixme', 'chore', 'note'],
            { placeHolder : 'Select annotation type (1/3)'}
        );

        if(!type_picked){
            vscode.window.showWarningMessage('[Grime] Annotation cancelled');
            return; 
        }

        const type = /** @type {'todo' | 'fixme' | 'chore' | 'note'} */ (type_picked);

        const description = await vscode.window.showInputBox({
            prompt : (type === 'note') ? 'Enter note (2/3)' : `Enter ${type} description (2/3)`
        });

        if(!description){
            vscode.window.showWarningMessage('[Grime] Annotation cancelled');
            return; 
        }
        
        const current_file = await vscode.window.showQuickPick(
            ['Yes', 'No'],
            { placeHolder: 'Is the current file associated with this annotation? (3/3)'}
        );

        if(!current_file){
            vscode.window.showWarningMessage('[Grime] Annotation cancelled');
            return; 
        }

        const file_relation = current_file === 'Yes' ? true : false;
        let line_number = null;

        if(file_relation){
            await vscode.window.showQuickPick(
                ['Yes', 'No (defaults to first line on document)'],
                { placeHolder: 'Are you on the specific line related to the annotation?'}
            ).then(selection => {
                if(selection === 'Yes'){
                    line_number = get_cursor_position() + 1;
                }
            });
        }

        this.create_and_store_annotation(type, description, file_relation, line_number);
    }

    async edit_annotation(tree_item){
        const { annotation, annotation_type } = tree_item;
      
        const type_picked = await vscode.window.showQuickPick(
            ['todo', 'fixme', 'chore', 'note'],
            { placeHolder : 'Select another annotation type or press Enter to proceed' }
        );

         if(!type_picked){
            vscode.window.showWarningMessage('[Grime] Annotation update cancelled');
            return; 
        }

        const type = /** @type {'todo' | 'fixme' | 'chore' | 'note'} */ (type_picked);

        const new_description = await vscode.window.showInputBox({
            prompt: (type === 'note') ? 'Update note (2/2)' : `Update ${type} description (2/2)`,
            value : annotation.description
        });

        if(!new_description || !new_description.trim()){
            vscode.window.showWarningMessage('[Grime] Annotation update cancelled');
            return; 
        }

        this.update_and_store_annotation(
            annotation_type,
            type,
            annotation, 
            new_description.trim()
        );

    }

    /**
     * Navigates to the file (and line if stored) of the associated annotation.
     *  
     * @param {object} [annotation] Annotation derived from the Tree Item class.  
     */
    async go_to_annotation(annotation){
        if(!annotation.file){
            vscode.window.showWarningMessage('[Grime] This annotation is not associated with a file');
            return;
        }
        
        const workspace_folders = vscode.workspace.workspaceFolders;

        if(!workspace_folders || workspace_folders.length === 0){
            vscode.window.showErrorMessage('[Grime] No workspace detected.');
            return;
        }

        const workspace_root = workspace_folders[0].uri.fsPath;

        const absolute_path = path.join(workspace_root, annotation.file);

        if(!fs.existsSync(absolute_path)){
            vscode.window.showErrorMessage(
                '[Grime] Associated file could not be found. This annotation may be stale.',
                { modal : true },
                'Delete Annotation'
            ).then(action => {
                if(action === 'Delete Annotation'){
                    this.delete_annotation(annotation.type, annotation.id);
                }
            });

            return;
        };

        const document = await vscode.workspace.openTextDocument(absolute_path);
        const editor = await vscode.window.showTextDocument(document);

        const target_line = Number.isInteger(annotation.line)
            ? annotation.line - 1 
            : 0;

        const position = new vscode.Position(target_line, 0);
        const selection = new vscode.Selection(position, position);

        editor.selection = selection; 
        editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
        );

    }
    /**
     * Builds an annotation object and delegates storage 
     * 
     * @param {'todo' | 'fixme' | 'chore' | 'note'} type 
     * @param {string} description 
     * @param {boolean} [file_relation] Checks whether the new annotation is related to the active file. 
     */
    create_and_store_annotation(type, description, file_relation, line_number = null){
        let file_location = null; 

        if(file_relation){
            const editor = vscode.window.activeTextEditor;

            if (editor){
                const workspace_folder = vscode.workspace.getWorkspaceFolder(
                    editor.document.uri
                );

                if(workspace_folder){
                    file_location = path.relative(
                        workspace_folder.uri.fsPath,
                        editor.document.uri.fsPath
                    );
                };
            }

        }

        const entry = {
            id : uuidv4(),
            type : type, 
            description : description, 
            created_at : new Date().toISOString(), 
            file: file_location, 
            line: line_number, 
            from_comment: false
        }

        this.store_annotation(type, entry);
    }
    /**
     * Stores the annotation entry in the correct JSON file. 
     * Detects duplicates and shows an error message if needed.
     * 
     * @param {'todo' | 'fixme' | 'chore' | 'note'} type 
     * @param {object} entry  
     * 
     */
    store_annotation(type, entry){
        const entries = this.storage_service.load_entries_by_type(type);

        const duplicate = entries.find(e =>
            (e.description?.trim().toLowerCase() || '') === entry.description.trim().toLowerCase() &&
            (e.file || null) === entry.file &&
            (e.line || null) === entry.line
        );

        if(duplicate){
            vscode.window.showErrorMessage('[Grime] Duplicate annotation detected. Entry not saved.');
            return;
        }

        entries.push(entry);

        this.storage_service.save_entries_by_type(type, entries); 

        vscode.window.showInformationMessage(`[Grime] ${type} saved successfully.`);

        if(this.annotation_tree_provider){
            this.annotation_tree_provider.refresh(); 
        }
    }

    /**
     * 
     * Allows for editing and migration of annotation.
     * 
     * @param {'todo' | 'fixme' | 'chore' | 'note'} old_type 
     * @param {'todo' | 'fixme' | 'chore' | 'note'} new_type 
     * @param {object} annotation 
     * @param {string} new_description 
     */
    update_and_store_annotation(old_type, new_type, annotation, new_description){
        const old_entries = this.storage_service.load_entries_by_type(old_type);

        const filtered_entries = old_entries.filter(e => e.id !== annotation.id);

        if(old_type !== new_type){
            this.storage_service.save_entries_by_type(old_type, filtered_entries);

            const new_entries = this.storage_service.load_entries_by_type(new_type);

            new_entries.push({
                ...annotation,
                type: new_type,
                description: new_description
            });

            this.storage_service.save_entries_by_type(new_type, new_entries);
        }else{
            const entry = old_entries.find(e => e.id === annotation.id);
            
            if(!entry){
                vscode.window.showErrorMessage('[Grime] Entry was not found. Nothing was updated.');
                return;
            }

            entry.description = new_description;

            this.storage_service.save_entries_by_type(old_type, old_entries);
        }

        vscode.window.showInformationMessage(`[Grime] ${new_type} was successfully updated.`);
        
        if(this.annotation_tree_provider){
            this.annotation_tree_provider.refresh();
        }

    }
    /**
     * 
     * @param {'todo' | 'fixme' | 'chore' | 'note'} type 
     * @param {string} annotation_id 
     * 
     */
    delete_annotation(type, annotation_id){
        const entries = this.storage_service.load_entries_by_type(type);

        const updated_entries = entries.filter(e => e.id !== annotation_id);

        if(updated_entries.length === entries.length){
            vscode.window.showErrorMessage('[Grime] Referenced annotation not found. Nothing was deleted');
            return; 
        }

        this.storage_service.save_entries_by_type(type, updated_entries);
        vscode.window.showInformationMessage(`[Grime] ${type} was deleted successfully.`);

        if(this.annotation_tree_provider){
            this.annotation_tree_provider.refresh();
        }

    }
}

module.exports = AnnotationService; 