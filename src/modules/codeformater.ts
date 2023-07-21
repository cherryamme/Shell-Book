import * as vscode from 'vscode';
import { exec } from 'child_process';
import { log } from './logging';
import * as path from 'path';

export async function provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    return new Promise((resolve, reject) => {
        // 调用shc程序处理文件
		const extensionPath = vscode.extensions.getExtension('cherryamme.shellbook')?.extensionPath;
		if (!extensionPath) {
			log.appendLine('Failed to get extension path');
			return;
		}
		const binShc = path.join(extensionPath, 'shfmt');
		exec(`${binShc} ${document.fileName}`, (error, stdout, stderr) => {
            if (error) {
                log.appendLine(`shc执行错误: ${error.message}`);
                reject(error);
                return;
            }

            if (stderr) {
                log.appendLine(`shc执行错误: ${stderr}`);
                reject(new Error(stderr));
                return;
            }

            // 使用shc的输出结果替换原文件的内容
            const lastLine = document.lineAt(document.lineCount - 1);
            const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
            const textEdit = vscode.TextEdit.replace(range, stdout);

            // 返回一个包含替换操作的TextEdit数组
            resolve([textEdit]);
        });
    });
}
