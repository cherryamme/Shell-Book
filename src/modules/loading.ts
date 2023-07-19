import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

export function addFunctionsToBashrc() {
	const bashrcPath = path.join(os.homedir(), '.bashrc');
	const extensionPath = vscode.extensions.getExtension('cherryamme.shellhero')?.extensionPath;
	if (!extensionPath) {
		vscode.window.showErrorMessage('Failed to get extension path');
		return;
	}
	const functionsFilePath = path.join(extensionPath, 'functions.sh');
	const sourceCommand = `\n# Source functions from VSCode Plugin\n[ -e ${functionsFilePath} ] && . ${functionsFilePath}\n`;

	fs.readFile(bashrcPath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
		if (err) {
			vscode.window.showErrorMessage('Failed to read .bashrc');
			return;
		}

		if (data.includes(sourceCommand)) {
			// vscode.window.showInformationMessage('.bashrc already contains source command');
			return;
		}

		fs.appendFile(bashrcPath, sourceCommand, (err: NodeJS.ErrnoException | null) => {
			if (err) {
				vscode.window.showErrorMessage('Failed to add source command to .bashrc');
			} else {
				vscode.window.showInformationMessage('Source command added to .bashrc successfully');
			}
		});
	});
}
