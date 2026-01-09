const vscode = require('vscode');
const crypto = require('crypto');
const path = require('path');

/**
 * Responsible for resolving workspace-related information 
 * and producing a stable workspace identifier (Means of avoiding folder-name collisions). 
 */
class WorkspaceService{

    /**
     * Returns the filesystem path of the active workspace. 
     * 
     * @returns {string|null} absolute workspace path or null if none exists. 
     */

    get_workspace_path(){
        const folders = vscode.workspace.workspaceFolders;

        if(!folders || folders.length === 0){
            return null;
        }

        return folders[0].uri.fsPath;
    }

    
    /**
     * Produces a stable has based on the workspace path.
     * Used to isolate Grime data per workspace
     *  
     * @returns {string|null} workspace hash or null if no workspace exists.
     */
    get_workspace_hash(){
        const workspace_path = this.get_workspace_path();

        if (!workspace_path){
            return null; 
        }

        const normalized_path = path.normalize(workspace_path);

        return crypto
            .createHash('sha256')
            .update(normalized_path)
            .digest('hex')
            .substring(0, 16);
    }

}

module.exports = WorkspaceService; 