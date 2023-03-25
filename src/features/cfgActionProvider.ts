import * as vscode from 'vscode';
import * as minimatch from 'minimatch';
import * as utils from '../other/utils';

export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection("anno-cfg");

  function checkFileName(fileName: string, modPaths: string[], line: vscode.TextLine, annoRda?: string) {
    let match;
    if (fileName.endsWith('.cfg')) {
      match = /<(Filename|FileName|\w+Map|\w+Tex)>([^<]+)<\/\1>/g.exec(line.text);
    }
    else if (fileName.endsWith('.cfg.yaml')) {
      match = /(FileName|\w+Map|\w+Tex): (.+)$/g.exec(line.text); 
    }

    let checked;
    if (match && (checked = utils.hasGraphicsFile(modPaths, match[2], annoRda)).length > 0) {
      const index = line.text.indexOf(match[2]);
      const range = new vscode.Range(line.lineNumber, index, line.lineNumber, index + match[2].length);

      const allPaths = annoRda ? [annoRda, ...modPaths] : modPaths;
  
      const diagnostic = new vscode.Diagnostic(range,
        `File seems to be missing.\nChecked paths:\n${allPaths.join('\n')}\nChecked patterns:\n${checked.join('\n')}`,
        vscode.DiagnosticSeverity.Warning);
      return diagnostic;
    }

    return undefined;
  };

  function refreshDiagnostics(doc: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    if (doc.lineCount > 10000 || !minimatch(doc.fileName, "**/*.cfg{,.yaml}")) {
      // ignore large files and non-assets.xmls
      return;
    }

    const config = vscode.workspace.getConfiguration('anno', doc.uri);
    const checkFileNames = config.get('checkFileNames');
    const annoRda: string | undefined = config.get('rdaFolder');
    const modsFolder: string | undefined = config.get('modsFolder');

    const diagnostics: vscode.Diagnostic[] = [];

    const modPaths = utils.searchModPaths(doc.uri.fsPath, modsFolder);

    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
      const lineOfText = doc.lineAt(lineIndex);

      if (checkFileNames) {
        const fileAction = checkFileName(doc.uri.fsPath, modPaths, lineOfText, annoRda);
        if (fileAction) {
          diagnostics.push(fileAction);
        }
      }
    }

    collection.set(doc.uri, diagnostics);
  }

// export function subscribeToDocumentChanges(context: vscode.ExtensionContext, diagnostics: vscode.DiagnosticCollection): void {
 
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, diagnostics);
  }

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      refreshDiagnostics(editor.document, diagnostics);
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, diagnostics), null, context.subscriptions);
  vscode.workspace.onDidCloseTextDocument(doc => diagnostics.delete(doc.uri), null, context.subscriptions);

  function createDiagnostic(doc: vscode.TextDocument, lineIndex: number): vscode.Diagnostic {
    const index = 0;
    const range = new vscode.Range(lineIndex, index, lineIndex, index + 5);
  
    const diagnostic = new vscode.Diagnostic(range,
      `test`,
      vscode.DiagnosticSeverity.Error);
    return diagnostic;
  }
}
