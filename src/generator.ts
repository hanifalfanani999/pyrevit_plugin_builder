import { PluginConfig, ScriptConfig, GeneratedFile } from './types';

export function generateExtensionFile(config: PluginConfig): string {
  return `# -*- coding: utf-8 -*-
"""
${config.name} - pyRevit Extension
Author: ${config.author}
Version: ${config.version}
${config.description}
"""
`;
}

export function generatePanelFile(config: PluginConfig): string {
  const scriptButtons = config.scripts.map((script, index) => {
    if (script.type === 'pushbutton') {
      return `    # ${script.title}
    ui.button(
        "${script.name}",
        script="${script.name}/script.py",
        bundle_file="${script.name}/icon.png",
        tooltip="${script.tooltip}",
    )`;
    } else if (script.type === 'togglebutton') {
      return `    # ${script.title}
    ui.toggle_button(
        "${script.name}",
        script="${script.name}/script.py",
        bundle_file="${script.name}/icon.png",
        tooltip="${script.tooltip}",
    )`;
    } else if (script.type === 'urlbutton') {
      return `    # ${script.title}
    ui.url_button(
        "${script.name}",
        url="${script.script}",
        bundle_file="${script.name}/icon.png",
        tooltip="${script.tooltip}",
    )`;
    }
    return '';
  }).join('\n\n');

  return `# -*- coding: utf-8 -*-
"""
Panel definition for ${config.panelName}
"""
from pyrevit import UI

ui = UI()

# Panel: ${config.panelName}
${scriptButtons}
`;
}

export function generateScriptFile(script: ScriptConfig): string {
  if (script.type === 'urlbutton') {
    return `# This is a URL button pointing to: ${script.script}\n`;
  }

  return `# -*- coding: utf-8 -*-
"""
${script.title}
${script.tooltip}
"""

from pyrevit import revit, DB, script
from pyrevit import forms

# Get the active document
doc = revit.doc
uidoc = revit.uidoc
output = script.get_output()

# Your code here
def main():
    """Main function."""
    output.print_md("# ${script.title}")
    output.print_md("Script is running...")
    
    # Example: Get all walls in the document
    # walls = DB.FilteredElementCollector(doc)\\
    #     .OfCategory(DB.BuiltInCategory.OST_Walls)\\
    #     .WhereElementIsNotElementType()\\
    #     .ToElements()
    # 
    # output.print_md("Found **{{}}** walls".format(len(walls)))
    
    # Example: Show a selection dialog
    # selected = forms.select_elements(doc, title="Select Elements")
    # if selected:
    #     output.print_md("Selected **{{}}** elements".format(len(selected)))
    
    # Example: Transaction
    # with revit.Transaction("${script.title}"):
    #     # Modify elements here
    #     pass

if __name__ == "__main__":
    main()
`;
}

export function generateExtensionDefinition(config: PluginConfig): string {
  return `# extension.json
{
    "builtin": "False",
    "default_enabled": "True",
    "type": "extension",
    "rocket_mode_compatible": "True",
    "name": "${config.bundleName}",
    "description": "${config.description}",
    "author": "${config.author}",
    "author_profile": "",
    "url": "",
    "website": "",
    "image": "",
    "dependencies": []
}
`;
}

export function generatePanelDefinition(config: PluginConfig): string {
  return `# panel.json
{
    "layout": {
        "type": "panel",
        "name": "${config.panelName}"
    }
}
`;
}

export function generateScriptDefinition(script: ScriptConfig): string {
  const base: Record<string, unknown> = {
    title: script.title,
    tooltip: script.tooltip,
    author: "",
  };

  if (script.type === 'pushbutton') {
    base.type = "pushbutton";
    base.script = "script.py";
  } else if (script.type === 'togglebutton') {
    base.type = "togglebutton";
    base.script = "script.py";
  } else if (script.type === 'urlbutton') {
    base.type = "urlbutton";
    base.hyperlink = script.script;
  }

  return `# ${script.name}.json
${JSON.stringify(base, null, 4)}
`;
}

export function generateAllFiles(config: PluginConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const basePath = `${config.bundleName}.extension`;

  // Extension definition
  files.push({
    path: `${basePath}/extension.json`,
    content: generateExtensionDefinition(config),
    language: 'json',
  });

  // Tab folder
  const tabPath = `${basePath}/${config.tabName}.tab`;

  // Panel definition
  files.push({
    path: `${tabPath}/${config.panelName}.panel/panel.json`,
    content: generatePanelDefinition(config),
    language: 'json',
  });

  // Scripts
  for (const script of config.scripts) {
    const scriptBasePath = `${tabPath}/${config.panelName}.panel/${script.name}.pushbutton`;
    
    // Script definition JSON
    files.push({
      path: `${scriptBasePath}/${script.name}.json`,
      content: generateScriptDefinition(script),
      language: 'json',
    });

    // Python script
    if (script.type !== 'urlbutton') {
      files.push({
        path: `${scriptBasePath}/script.py`,
        content: generateScriptFile(script),
        language: 'python',
      });
    }

    // Icon placeholder note
    files.push({
      path: `${scriptBasePath}/icon.png`,
      content: '[Place your 32x32 icon.png here]',
      language: 'text',
    });
  }

  return files;
}

export function generateFolderStructure(config: PluginConfig): string {
  const lines: string[] = [];
  const basePath = `${config.bundleName}.extension`;
  
  lines.push(`📁 ${basePath}/`);
  lines.push(`   ├── 📄 extension.json`);
  lines.push(`   └── 📁 ${config.tabName}.tab/`);
  lines.push(`       └── 📁 ${config.panelName}.panel/`);
  lines.push(`           ├── 📄 panel.json`);
  
  config.scripts.forEach((script, i) => {
    const prefix = i === config.scripts.length - 1 ? '└' : '├';
    lines.push(`           ${prefix}── 📁 ${script.name}.pushbutton/`);
    lines.push(`           │   ├── 📄 ${script.name}.json`);
    if (script.type !== 'urlbutton') {
      lines.push(`           │   ├── 📄 script.py`);
    }
    lines.push(`           │   └── 🖼️ icon.png`);
  });

  return lines.join('\n');
}
