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

    const parseSymbols = (
      startLine: number,
      endLine: number,
      parentSymbol: vscode.DocumentSymbol | null = null
    ): vscode.DocumentSymbol[] => {
      const result: vscode.DocumentSymbol[] = [];

      const startLines: Record<string, number> = {};
      const endLines: Record<string, number> = {};
      const isStart: Record<string, boolean> = {};
      const title: Record<string, string> = {};

      this.chunkConfig.forEach((chunk) => {
        isStart[chunk.id] = true;
        startLines[chunk.id] = -1;
        endLines[chunk.id] = -1;
        title[chunk.id] = "null";
      });

      for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
        const line = lines[lineNumber];

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
          title[chunkStart.id] = line.trimStart().split(/\s+/).slice(1).join(" ") || 'null';
          startLines[chunkStart.id] = lineNumber;
          isStart[chunkStart.id] = false;
        } else if (chunkEnd) {
          endLines[chunkEnd.id] = lineNumber;
          const range = new vscode.Range(
            startLines[chunkEnd.id],
            0,
            endLines[chunkEnd.id],
            lines[endLines[chunkEnd.id]].length
          );
          const symbol = new vscode.DocumentSymbol(
            title[chunkEnd.id],
            '',
            vscode.SymbolKind.Class,
            range,
            range
          );
          for (let i = startLines[chunkEnd.id] + 1; i < endLines[chunkEnd.id]; i++) {
            const childLine = document.lineAt(i);
            if (!childLine.isEmptyOrWhitespace) {
              const childRange = childLine.range;
              const childSymbol = new vscode.DocumentSymbol(
                childLine.text.trim(),
                '',
                vscode.SymbolKind.Method,
                childRange,
                childRange
              );
              symbol.children.push(childSymbol);
            }
          }

          parseSymbols(startLines[chunkEnd.id] + 1, endLines[chunkEnd.id] - 1, symbol);

          if (parentSymbol) {
            parentSymbol.children.push(symbol);
          } else {
            result.push(symbol);
          }

          isStart[chunkEnd.id] = true;
        }
      }

      return result;
    };

    symbols.push(...parseSymbols(0, lines.length - 1));
    return symbols;
  }
}
