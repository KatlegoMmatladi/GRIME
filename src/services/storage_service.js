const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
/**
 * 
 * Handles all filesystem interactions for Grime extension. 
 * Responsible for directory creation, file validation and read access. 
 * 
 */
class StorageService{
    /**
     * 
     * @param {string} global_storage_path
     * Absolute path provided by VS Code API for extension-wide storage
     *  
     * @param {string} workspace_hash 
     * Stable identifier derived from workspace path.
     * 
     */ 
    constructor(global_storage_path, workspace_hash){
        this.global_storage_path = global_storage_path;
        this.workspace_hash = workspace_hash; 

        this.workspace_storage_path = path.join(
            this.global_storage_path,
            this.workspace_hash
        );

        /**
         * 
         * Canonical mapping between annotation types (or tasks) and storage files.
         */
        this.type_files = {
            todo: 'todos.json',
            fixme: 'fixes.json',
            chore: 'chores.json',
            note: 'notes.json'
        };
    }

    /**
     * Ensures the workspace-specific storage directory exists.
     * 
     * @returns {void}
     */
    ensure_workspace_directory(){
        if(!fs.existsSync(this.workspace_storage_path)){
            fs.mkdirSync(this.workspace_storage_path, { recursive : true})
        }
    }

    /**
     * Ensures that all annotation-type JSON files exists and are valid. 
     * Creates empty files if missing and validates existing ones. 
     * 
     * @returns {void}
     * 
     */
    ensure_type_files(){
        for(const file_name of Object.values(this.type_files)){
            const file_path = path.join(this.workspace_storage_path, file_name);

            if(!fs.existsSync(file_path)){
                fs.writeFileSync(file_path, '[]', { encoding : 'utf-8'})
            } else {
                this.validate_and_fix_json(file_path);
            }
        }
    }

    /**
     * Loads all entries for a given annotation file type. 
     * 
     * @param {'todo'|'fixme'|'chore'|'note'} type 
     * @returns {Array<object>} list of stored annotation entries. 
     * @throws {Error} if the annotation type is not valid/is unrecognized.
     */

    load_entries_by_type(type){
        const file_name = this.type_files[type]; 

        if(!file_name){
            vscode.window.showErrorMessage(`[Grime] Unknown Annotation type found at ${file_name}: ${type}`);
            console.error('Invalid Type Fund', type);
            return; 
        }

        const file_path = path.join(this.workspace_storage_path, file_name); 
        const raw_content = fs.readFileSync(file_path, 'utf-8');

        return JSON.parse(raw_content);
    }

    /**
     * 
     * @param {'todo' | 'fixme' | 'chore' | 'note'} type 
     * @param {array} entries 
     * 
     */
    save_entries_by_type(type, entries){
        const file_name = this.type_files[type];

        if(!file_name){
            console.error('[Grime] Invalid Type passed', type);
            throw new Error(`Invalid type : ${type}`);
        }

        const file_path = path.join(
            this.workspace_storage_path,
            this.type_files[type]
        );

        fs.writeFileSync(file_path, JSON.stringify(entries, null, 2), 'utf-8');
    }

    /**
     * Validates that a JSON file is well-formed and readable. 
     * Creates a backup of corrupt file, if deteceted and recreates new, empty file. 
     * 
     * @param {string} file_path
     * @returns {void}
     */
    validate_and_fix_json(file_path){

        try {
            const raw_content = fs.readFileSync(file_path, 'utf-8');
            JSON.parse(raw_content);
        }catch (error){
            fs.renameSync(file_path, `${file_path}.backup-${Date.now()}`);
            fs.writeFileSync(file_path, '[]', { encoding : 'utf-8'});
            console.warn(`[Grime] JSON File ${file_path} was not valid. It has been backed up and recreated -> ${error}`);
            vscode.window.showWarningMessage(`[Grime] JSON File ${file_path} was not valid. It has been backed up and recreated -> ${error}`);
        }

    }
}

module.exports = StorageService;