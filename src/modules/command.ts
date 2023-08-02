import * as vscode from 'vscode';
import { settings } from './config';
import { log } from './logging';
export function createStatusBarItem(): vscode.StatusBarItem {
    let statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBar.text = "Shell Command";
    statusBar.command = "shellbook.quickPickCommand";
    statusBar.show();
    return statusBar;
}

export const ADD_COMMAND = "Add Custom Command";

export function createQuickPick() {
    const quickPick = vscode.window.createQuickPick();

    quickPick.onDidChangeSelection((selection) => {
        if (selection[0].label === ADD_COMMAND) {
            vscode.commands.executeCommand("workbench.action.openSettings", `@id:shellbook.customCommands @ext:cherryamme.shellbook`);
        } else {
            log.appendLine(`Selected: ${selection[0].label}`);
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
            terminal.show();
            const picked: boolean = selection[0].picked === true;
            terminal.sendText(`${selection[0].description}`, picked);
        }
        quickPick.hide();
    });

    return quickPick;
}

export async function sendToTerminal(uri: vscode.Uri, range: vscode.Range) {
    const document = await vscode.workspace.openTextDocument(uri);
    const codeBlock = "(" + document.getText(range) + "\n)";

    const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
    log.appendLine(`\nSending to terminal: ${codeBlock}`);
    terminal.show();
    terminal.sendText(codeBlock);
}

export async function sendToQsub(uri: vscode.Uri, range: vscode.Range, firstWord: string) {
    const document = await vscode.workspace.openTextDocument(uri);
    const code = document.getText(range);

    // Send the code chunk to the terminal using echo command
    const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
    log.appendLine(`\nqsub Sending to terminal: ${code}`);
    terminal.show();
    let command = settings.qsubConfig.toString().replace('${code}', code.toString());
    command = command.replace('${title}', firstWord);
    terminal.sendText(`${command}`);
}
