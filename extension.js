const vscode = require('vscode');

const AnnotationTreeProvider = require('./src/services/annotation_tree_provider');
const WorkspaceService = require('./src/services/workspace_service');
const StorageService = require('./src/services/storage_service');
const AnnotationService = require('./src/services/annotation_service');

/**
 * Entry point for the Grime VS Code extension. 
 * 
 * @param {vscode.ExtensionContext} context 
 * Provided by vscode during extension activation.
 */
function activate(context){
    const workspace_service = new WorkspaceService(); 
    const workspace_hash = workspace_service.get_workspace_hash(); 

    if(!workspace_hash){
        vscode.window.showWarningMessage('[Grime] No Workspace Detected. Initialization Skipped.');
        return;
    }

    const global_storage_path = context.globalStorageUri.fsPath; 

    const storage_service = new StorageService(
        global_storage_path, 
        workspace_hash
    );

    storage_service.ensure_workspace_directory(); 
    storage_service.ensure_type_files(); 
    
    const annotation_tree_provider = new AnnotationTreeProvider(storage_service);
    vscode.window.registerTreeDataProvider('grime_annotations_tree', annotation_tree_provider);


    const annotation_service = new AnnotationService(storage_service, annotation_tree_provider);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'grime.add_annotation',
            async () => {
                await annotation_service.prompt_and_store_annotation();
        }),
          vscode.commands.registerCommand(
            'grime.edit_annotation',
            (tree_item) => {
                 annotation_service.edit_annotation(tree_item);
            }
        ),
        vscode.commands.registerCommand(
            'grime.delete_annotation',
            (tree_item) => {
                annotation_service.delete_annotation(
                    tree_item.annotation_type, 
                    tree_item.annotation.id
        )}),
        vscode.commands.registerCommand(
            'grime.go_to_annotation',
            (tree_item) => {
                annotation_service.go_to_annotation(tree_item.annotation);
            }
        )
      
    )

}

function deactivate(){}

module.exports = {
    activate, 
    deactivate
};