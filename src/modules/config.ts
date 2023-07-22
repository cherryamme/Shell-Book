import * as vscode from "vscode";

export let settings = {
    customCommands: vscode.workspace.getConfiguration("shellbook").get("customCommands", []),
    chunkConfig: vscode.workspace.getConfiguration("shellbook").get("chunkFormat", []),
    qsubConfig: vscode.workspace.getConfiguration("shellbook").get("qsubCommandFormat", []),
    chunkbackgroudcolor: vscode.workspace.getConfiguration("shellbook").get("chunkbackgroudcolor", []),
};

export function updateSettings() {
    settings = {
        ...settings, // keep the existing properties
        // Update your settings properties...
        customCommands: vscode.workspace.getConfiguration("shellbook").get("customCommands", []),
        chunkbackgroudcolor: vscode.workspace.getConfiguration("shellbook").get("chunkbackgroudcolor", []),
        chunkConfig: vscode.workspace.getConfiguration("shellbook").get("chunkFormat", []),
        qsubConfig: vscode.workspace.getConfiguration("shellbook").get("qsubCommandFormat", []),
    };
}
