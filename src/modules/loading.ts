import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { log } from './logging';

export function addFunctionsToBashrc() {
	const bashrcPath = path.join(os.homedir(), '.bashrc');
	const extensionPath = vscode.extensions.getExtension('cherryamme.shellbook')?.extensionPath;
	if (!extensionPath) {
		vscode.window.showErrorMessage('Failed to get extension path');
		return;
	}
	const functionsFilePath = path.join(extensionPath, 'functions.sh');
	const souceTitle = "# Source functions from VSCode Plugin";
	const sourceCommand = `\n${souceTitle}\n[ -e ${functionsFilePath} ] && . ${functionsFilePath}\n`;

	fs.readFile(bashrcPath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
		if (err) {
			log.appendLine('Failed to read .bashrc');
			return;
		}

		if (data.includes(souceTitle)) {
			const regex = /# Source functions from VSCode Plugin\n.*\n/;
        	const replacedData = data.replace(regex, "");
        
        	fs.writeFile(bashrcPath, replacedData, (err: NodeJS.ErrnoException | null) => {
            	if (err) {
            	    log.appendLine('Failed to remove existing source command from .bashrc');
            	} else {
            	    log.appendLine('Existing source command removed from .bashrc');
            }
        });
		}

		fs.appendFile(bashrcPath, sourceCommand, (err: NodeJS.ErrnoException | null) => {
			if (err) {
				log.appendLine('Failed to add source command to .bashrc');
			} else {
				log.appendLine('Source command added to .bashrc successfully');
			}
		});
	});
}
