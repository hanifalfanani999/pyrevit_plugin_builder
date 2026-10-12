export interface ScriptConfig {
  id: string;
  name: string;
  title: string;
  tooltip: string;
  type: 'pushbutton' | 'pulldown' | 'togglebutton' | 'urlbutton';
  script: string;
  icon: string;
  panel?: string;
  tab?: string;
}

export interface PluginConfig {
  name: string;
  bundleName: string;
  author: string;
  description: string;
  version: string;
  scripts: ScriptConfig[];
  panelName: string;
  tabName: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}
