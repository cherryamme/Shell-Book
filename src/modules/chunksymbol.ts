import * as vscode from 'vscode';
import { settings } from './config';

interface Chunk {
  start: string;
  end: string;
  id: string;
}

export class RunShellDocumentSymbolProvider
  implements vscode.DocumentSymbolProvider {
  private chunkConfig: Chunk[] = settings.chunkConfig;

  public async provideDocumentSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]> {
    const symbols: vscode.DocumentSymbol[] = [];

    const text = document.getText();
    const lines = text.split(/\r?\n/);

    let title = '';
    let startLine = -1;
    const isStart: Record<string, boolean> = {};

    // Initialize isStart values for each chunk
    this.chunkConfig.forEach((chunk) => {
      isStart[chunk.id] = true;
    });

    lines.forEach((line, lineNumber) => {
      const chunkStart = this.chunkConfig.find(
        (chunk) =>
          line.match(
            new RegExp(
              `^\\s*${chunk.start}(\\s|(?!${chunk.start.charAt(
                chunk.start.length - 1
              )}))`
            )
          )
      );
      const chunkEnd = this.chunkConfig.find(
        (chunk) =>
          line.match(
            new RegExp(
              `^\\s*${chunk.end}(\\s|(?!${chunk.end.charAt(
                chunk.end.length - 1
              )}))`
            )
          )
      );

      if (chunkStart && isStart[chunkStart.id]) {
        // Extract the first word after 'start'
        title = line.trimStart().split(/\s+/)[1] || 'null';
        startLine = lineNumber;
        isStart[chunkStart.id] = false;
      } else if (chunkEnd) {
        const range = new vscode.Range(startLine, 0, lineNumber, line.length);
        const symbol = new vscode.DocumentSymbol(
          title,
          '',
          vscode.SymbolKind.Class,
          range,
          range
        );

        // Add child symbols for each non-empty line within the code chunk
        for (let i = startLine + 1; i < lineNumber; i++) {
          const childLine = document.lineAt(i);
          if (!childLine.isEmptyOrWhitespace) {
            const childRange = childLine.range;
            const childSymbol = new vscode.DocumentSymbol(
              childLine.text,
              '',
              vscode.SymbolKind.Method,
              childRange,
              childRange
            );
            symbol.children.push(childSymbol);
          }
        }

        symbols.push(symbol);
        isStart[chunkEnd.id] = true;
      }
    });

    return symbols;
  }
}
