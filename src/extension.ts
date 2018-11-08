'use strict';
import { languages, ExtensionContext, DocumentFilter } from 'vscode';
import { MessagesCompletionProvider } from './CompletionProvider';
import { MessagesDefinitionProvider } from './DefinitionProvider';
import { MessagesHoverProvider } from './HoverProvider';

const extName = 'reactIntl';

export function activate(context: ExtensionContext) {
  const mode: DocumentFilter[] = [
    { language: 'typescriptreact', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' },
    { language: 'javascript', scheme: 'file' },
  ];

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      mode,
      new MessagesCompletionProvider(),
      '.',
    ),
  );

  context.subscriptions.push(
    languages.registerDefinitionProvider(
      mode,
      new MessagesDefinitionProvider(),
    ),
  );

  context.subscriptions.push(
    languages.registerHoverProvider(mode, new MessagesHoverProvider()),
  );
}

export function deactivate() { }
