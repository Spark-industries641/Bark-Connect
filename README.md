# bark-vscode-connector

**bark-vscode-connector** is a Visual Studio Code extension that integrates with [Bark] enabling users to track and untrack files. These tracked files are then used as context in AI conversations within Bark, enhancing the relevance and effectiveness of your interactions with AI assistants like ChatGPT.

## Features

- **Track Files**: Select and track specific files from your workspace to include them as context in your Bark AI conversations.
  
  ![Track Feature](images/track-feature.png)

- **Untrack Files**: Remove files from the tracked list to manage the context provided to the AI.
  
  ![Untrack Feature](images/untrack-feature.png)

## Requirements

- **Visual Studio Code**: Version **1.61.0** or higher.
- **Bark Account**: An account with [Bark](https://bark.com) to utilize AI conversation features.
- **Network Access**: The extension communicates with Bark's API; ensure that your network allows outgoing HTTPS requests to the configured API URL.

## Getting Started

1. **Start Tracking Files**:
   - Open the sidebar by clicking on the **Bark Connect** icon in the activity bar.
   - Use the **Track** and **Untrack** commands to manage which files are included as context.

2. **Interact with Bark**:
   - Initiate conversations with Bark's AI, which will utilize the tracked files to provide informed responses.

**Enjoy enhancing your AI conversations with context-aware insights!**