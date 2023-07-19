import * as vscode from 'vscode';
import { QuickPickItem, window, Terminal } from 'vscode';
import {addFunctionsToBashrc} from './modules/loading';
import { sendToTerminal,sendToQsub,createQuickPick,createStatusBarItem,ADD_COMMAND } from "./modules/command";

import { settings,updateSettings } from "./modules/config";
import { RunShellCodeLensProvider,codeChunkDecorationType,updateDecorations } from "./modules/codechunk";

export function activate(context: vscode.ExtensionContext) {
    addFunctionsToBashrc();
    // Register a command for the user to manually trigger the function
    context.subscriptions.push(vscode.commands.registerCommand('shellbook.addBashFunctions', () => {addFunctionsToBashrc();}));

    const statusBar = createStatusBarItem();
    context.subscriptions.push(statusBar);
    
    const quickPick = createQuickPick();

    context.subscriptions.push(vscode.commands.registerCommand("shellbook.quickPickCommand", () => {
        quickPick.items = [
            ...settings.customCommands,
            { label: ADD_COMMAND, description: " Add your own custom command." },
        ];
        quickPick.show();
    }));


    const runShellCodeLensProvider = new RunShellCodeLensProvider();

    context.subscriptions.push(vscode.languages.registerCodeLensProvider('shellscript', runShellCodeLensProvider));

    // Register the 'extension.sendToTerminal' command
    context.subscriptions.push(vscode.commands.registerCommand('shellbook.sendToQsub', sendToQsub));
    // Register the 'extension.sendToQsub' command
    context.subscriptions.push(vscode.commands.registerCommand('shellbook.sendToTerminal', sendToTerminal));


    vscode.workspace.onDidSaveTextDocument(async (document) => {
        await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
    });
    vscode.workspace.onDidOpenTextDocument(async (document) => {
        await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
    });

    vscode.window.onDidChangeActiveTextEditor(async (event) => {
        await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
    });
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
    });

    vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('shellbook')) {
                updateSettings();
            }
        });
}


export function deactivate() { }