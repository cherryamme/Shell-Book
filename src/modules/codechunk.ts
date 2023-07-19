import * as vscode from "vscode";
import { settings } from "./config";

interface Chunk {
  start: string;
  end: string;
  id: string;
}

export class RunShellCodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private chunkConfig: Chunk[] = settings.chunkConfig;

  public async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
    this.codeLenses = [];

    const text = document.getText();
    const lines = text.split(/\r?\n/);

    let startLine = -1;
    let endLine = -1;
    let title = "";
    let currentChunkId: string | null = null;
    let isStart = true;

    lines.forEach((line, lineNumber) => {
      const chunkStart = this.chunkConfig.find((chunk) => line.startsWith(chunk.start) && (currentChunkId === null || chunk.id !== currentChunkId));
      const chunkEnd = this.chunkConfig.find((chunk) => line.startsWith(chunk.end) && chunk.id === currentChunkId);

      if (chunkStart && (isStart || chunkStart.id !== currentChunkId)) {
        startLine = lineNumber;
        currentChunkId = chunkStart.id;
        // Extract the first word after 'start'
        title = line.split(/\s+/)[1] || "null";
        isStart = !isStart;
      } else if (chunkEnd && !isStart) {
        endLine = lineNumber;
        const codeChunkRanges: vscode.Range[] = [];
        if (startLine !== -1) {
          const range = new vscode.Range(startLine, 0, endLine, lines[endLine].length);
          const sendToTerminalCodeLens = new vscode.CodeLens(range, {
            title: 'Send to Terminal',
            command: 'shellbook.sendToTerminal',
            arguments: [document.uri, range]
          });
          // Send to qsub CodeLens
          const sendToQsubCodeLens = new vscode.CodeLens(range, {
            title: 'Send to qsub',
            command: 'shellbook.sendToQsub',

            arguments: [document.uri, range, title]
          });

          this.codeLenses.push(sendToTerminalCodeLens);
          this.codeLenses.push(sendToQsubCodeLens);
          codeChunkRanges.push(new vscode.Range(startLine, 0, endLine, lines[endLine].length));

        }
        currentChunkId = null;
        isStart = !isStart;
      }
    });

    return this.codeLenses;
  }
}


export const codeChunkDecorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(56, 56, 56, 0.5)',
	borderRadius: '0px',
	isWholeLine: true
});


export async function updateDecorations(editor: vscode.TextEditor | undefined,provider: RunShellCodeLensProvider) {
	if (editor && editor.document.languageId === 'shellscript') {
		vscode.commands.executeCommand('setContext', 'isShellScript', true);
		const codeChunks = await provider.provideCodeLenses(editor.document);

		const maxAttempts = 3;
		const attemptInterval = 1000; // 2000 milliseconds = 2 seconds
		const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			if (codeChunks) {
				const codeChunkRanges = codeChunks.map(chunk => chunk.range);
				editor.setDecorations(codeChunkDecorationType, codeChunkRanges);
				break;
			}
			await delay(attemptInterval);
		}
	}
}
