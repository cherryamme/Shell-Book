import * as vscode from 'vscode';
import { QuickPickItem, window, Terminal } from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 快捷指令
    const ADD_COMMAND = "Add Custom Command";
    let statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBar.text = "Shell Command";
    statusBar.command = "extension.quickPickCommand";
    statusBar.show();
    context.subscriptions.push(statusBar);

    const quickPick = vscode.window.createQuickPick();

    quickPick.onDidChangeSelection((selection) => {
        if (selection[0].label === ADD_COMMAND) {
            vscode.commands.executeCommand("workbench.action.openSettings", `@id:extension.customCommands @ext:cherryamme.shellhero`);
        } else {
            vscode.window.showInformationMessage(`Selected: ${selection[0].label}`);
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
            terminal.show();
            const command: boolean = selection[0].picked === true;
            terminal.sendText(`${selection[0].label}`, command);
        }
        quickPick.hide();
    });

    const disposable = vscode.commands.registerCommand(
        "extension.quickPickCommand",
        () => {
            const customCommands = vscode.workspace.getConfiguration("extension").get("customCommands", []);
            quickPick.items = [
                ...customCommands,
                { label: ADD_COMMAND, description: " Add your own custom command." },
            ];
            quickPick.show();
        }
    );





    context.subscriptions.push(disposable);

    class RunShellCodeLensProvider implements vscode.CodeLensProvider {
        private codeLenses: vscode.CodeLens[] = [];
        private regexStepon = /^stepon/;
        private regexStepoff = /^stepoff/;

        public async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
            this.codeLenses = [];

            const text = document.getText();
            const lines = text.split(/\r?\n/);

            let startLine = -1;
            let endLine = -1;
            let firstWord = "";

            lines.forEach((line, lineNumber) => {
                if (this.regexStepon.test(line)) {
                    startLine = lineNumber;
                    // Extract the first word after 'stepon'
                    firstWord = line.split(/\s+/)[1];
                } else if (this.regexStepoff.test(line)) {
                    endLine = lineNumber;
                    const codeChunkRanges: vscode.Range[] = [];
                    if (startLine !== -1) {
                        const range = new vscode.Range(startLine, 0, endLine, lines[endLine].length);
                        const sendToTerminalCodeLens = new vscode.CodeLens(range, {
                            title: 'Send to Terminal',
                            command: 'extension.sendToTerminal',
                            arguments: [document.uri, range]
                        });
                        // Send to qsub CodeLens
                        const sendToQsubCodeLens = new vscode.CodeLens(range, {
                            title: 'Send to qsub',
                            command: 'extension.sendToQsub',
                            arguments: [document.uri, range, firstWord]
                        });

                        this.codeLenses.push(sendToTerminalCodeLens);
                        this.codeLenses.push(sendToQsubCodeLens);
                        codeChunkRanges.push(new vscode.Range(startLine, 0, endLine, lines[endLine].length));

                    }
                }
            });

            return this.codeLenses;
        }
    }

    const runShellCodeLensProvider = new RunShellCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider('shellscript', runShellCodeLensProvider));
    // Register the 'extension.sendToTerminal' command
    context.subscriptions.push(vscode.commands.registerCommand('extension.sendToTerminal', async (uri: vscode.Uri, range: vscode.Range) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const codeBlock = "(" + document.getText(range) + ")";

        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
        terminal.show();
        terminal.sendText(codeBlock);
    }));
    // Register the 'extension.sendToQsub' command
    context.subscriptions.push(vscode.commands.registerCommand('extension.sendToQsub', async (uri: vscode.Uri, range: vscode.Range, firstWord: string) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const text = document.getText(range);

        // Send the code chunk to the terminal using echo command
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
        terminal.show();
        terminal.sendText(`echo "(${text})" | qsub -cwd -l vf=20G,p=10 -P B2C_RDS -S /bin/bash -q b2c_rd_s1.q -N ${firstWord} `);
    }));

    const codeChunkDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(56, 56, 56, 0.5)',
        borderRadius: '0px',
        isWholeLine: true
    });
    
    async function updateDecorations(editor: vscode.TextEditor | undefined) {
        if (editor && editor.document.languageId === 'shellscript') {
            vscode.commands.executeCommand('setContext', 'isShellScript', true);
    
            const codeChunks = await runShellCodeLensProvider.provideCodeLenses(editor.document);
    
            if (codeChunks) {
                const codeChunkRanges = codeChunks.map(chunk => chunk.range);
                editor.setDecorations(codeChunkDecorationType, codeChunkRanges);
            }
        }
    }
    
    vscode.workspace.onDidOpenTextDocument(async (document) => {
        updateDecorations(vscode.window.activeTextEditor);
    });
    
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        updateDecorations(vscode.window.activeTextEditor);
    });
}


export function deactivate() { }
