import * as vscode from 'vscode';
import { QuickPickItem, window, Terminal } from 'vscode';
import {addFunctionsToBashrc} from './modules/loading';
import { sendToTerminal,sendToQsub,createQuickPick,createStatusBarItem,ADD_COMMAND } from "./modules/command";
import { log } from "./modules/logging";
import { settings,updateSettings } from "./modules/config";
import { RunShellCodeLensProvider,updateDecorations } from "./modules/codechunk";
import { provideDocumentFormattingEdits } from "./modules/codeformater";

export function activate(context: vscode.ExtensionContext) {
    log.appendLine('shell Book extension activated');
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
        if (document && document.languageId === 'shellscript') {
        await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
        
        log.append(`\nonDidSaveTextDocument: ${document.fileName}`);
        }
    }
    );
    vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document && document.languageId === 'shellscript') {
        if (vscode.window.activeTextEditor) {
            await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
            log.append(`\nonDidOpenTextDocument: ${document.fileName}`);
        }
    }
    });
    
    vscode.window.onDidChangeActiveTextEditor(async (event) => {
        if (event && event.document && event.document.languageId === 'shellscript') {
            log.append(`\nonDidChangeActiveTextEditor: ${event.document.fileName}`);
            await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
        }
    });
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.contentChanges.length > 0 && vscode.window.activeTextEditor && event.document.languageId === 'shellscript') {
            await updateDecorations(vscode.window.activeTextEditor,runShellCodeLensProvider);
            log.append(".");
        }
    });

    vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('shellbook')) {
                updateSettings();
            }
        });





        // add code format
        const provider = {
            provideDocumentFormattingEdits,
        };
    
        const selector = { scheme: 'file', language: 'shellscript' };
        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(selector, provider));
    
}


export function deactivate() { }
